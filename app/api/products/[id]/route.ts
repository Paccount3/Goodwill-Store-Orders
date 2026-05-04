import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { STAFF_APPAREL_CATEGORY } from '@/lib/product-categories'
import { buildUniformSizePriceMap } from '@/lib/uniform-helpers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      unitPriceCents,
      maxQuantity,
      sortOrder,
      totalInStock,
      availableSizes,
      availableColors,
      style,
      sizePriceMap,
      isUniform,
    } = body

    const updateData: Record<string, unknown> = {}

    if (unitPriceCents !== undefined) {
      if (unitPriceCents < 0) {
        return NextResponse.json(
          { error: 'Invalid unitPriceCents value' },
          { status: 400 }
        )
      }
      updateData.unitPriceCents = Math.round(Number(unitPriceCents) * 100)
    }

    if (maxQuantity !== undefined) {
      if (maxQuantity < 0 || !Number.isInteger(maxQuantity)) {
        return NextResponse.json(
          { error: 'Invalid maxQuantity value' },
          { status: 400 }
        )
      }
      updateData.maxQuantity = parseInt(String(maxQuantity), 10)
    }

    if (sortOrder !== undefined) {
      const n = Number(sortOrder)
      if (!Number.isInteger(n) || n < 0) {
        return NextResponse.json({ error: 'Invalid sortOrder value' }, { status: 400 })
      }
      updateData.sortOrder = n
    }

    if (totalInStock !== undefined) {
      if (totalInStock < 0 || !Number.isInteger(totalInStock)) {
        return NextResponse.json(
          { error: 'Invalid totalInStock value' },
          { status: 400 }
        )
      }
      updateData.totalInStock = parseInt(String(totalInStock), 10)
    }

    if (isUniform !== undefined) {
      updateData.isUniform = Boolean(isUniform)
    }

    if (style !== undefined) {
      updateData.style = style === null || style === '' ? null : String(style)
    }

    if (availableSizes !== undefined) {
      if (availableSizes === null) {
        updateData.availableSizes = null
      } else if (Array.isArray(availableSizes)) {
        updateData.availableSizes = JSON.stringify(availableSizes)
      } else {
        return NextResponse.json({ error: 'availableSizes must be an array or null' }, { status: 400 })
      }
    }

    if (availableColors !== undefined) {
      if (availableColors === null) {
        updateData.availableColors = null
      } else if (Array.isArray(availableColors)) {
        updateData.availableColors = JSON.stringify(availableColors)
      } else {
        return NextResponse.json({ error: 'availableColors must be an array or null' }, { status: 400 })
      }
    }

    if (sizePriceMap !== undefined) {
      if (sizePriceMap === null) {
        updateData.sizePriceMap = null
      } else if (typeof sizePriceMap === 'object' && !Array.isArray(sizePriceMap)) {
        updateData.sizePriceMap = JSON.stringify(sizePriceMap)
      } else {
        return NextResponse.json({ error: 'sizePriceMap must be an object or null' }, { status: 400 })
      }
    }

    const id = parseInt(params.id, 10)
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const mergedCategory = existing.category
    if (mergedCategory === STAFF_APPAREL_CATEGORY) {
      let sizes: string[] | null = null
      let colors: string[] | null = null
      if (availableSizes !== undefined) {
        sizes = Array.isArray(availableSizes) ? availableSizes.map(String) : null
      } else if (existing.availableSizes) {
        try {
          const p = JSON.parse(existing.availableSizes)
          sizes = Array.isArray(p) ? p.map(String) : null
        } catch {
          sizes = null
        }
      }
      if (availableColors !== undefined) {
        colors = Array.isArray(availableColors) ? availableColors.map(String) : null
      } else if (existing.availableColors) {
        try {
          const p = JSON.parse(existing.availableColors)
          colors = Array.isArray(p) ? p.map(String) : null
        } catch {
          colors = null
        }
      }
      if (
        (availableSizes !== undefined || availableColors !== undefined) &&
        (!sizes?.length || !colors?.length)
      ) {
        return NextResponse.json(
          { error: 'Staff Apparel products must have at least one size and one color' },
          { status: 400 }
        )
      }
      updateData.isUniform = true
      if (unitPriceCents !== undefined && sizes?.length && sizePriceMap === undefined) {
        const cents = Math.round(Number(unitPriceCents) * 100)
        updateData.sizePriceMap = JSON.stringify(buildUniformSizePriceMap(sizes, cents))
      } else if (
        sizePriceMap === undefined &&
        availableSizes !== undefined &&
        Array.isArray(availableSizes) &&
        availableSizes.length > 0 &&
        unitPriceCents === undefined
      ) {
        updateData.sizePriceMap = JSON.stringify(
          buildUniformSizePriceMap(availableSizes.map(String), existing.unitPriceCents)
        )
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    if (
      mergedCategory === STAFF_APPAREL_CATEGORY &&
      typeof updateData.sizePriceMap === 'string' &&
      updateData.sizePriceMap
    ) {
      try {
        const m = JSON.parse(updateData.sizePriceMap) as Record<string, number>
        const vals = Object.values(m).map((v) => Number(v)).filter((v) => Number.isFinite(v))
        if (vals.length) {
          updateData.unitPriceCents = Math.min(...vals)
        }
      } catch {
        // keep existing unit price if map JSON is invalid (should not happen after validation above)
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData as any,
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if product is used in any orders
    const orderLines = await prisma.orderLine.findFirst({
      where: { productId: parseInt(params.id) },
    })

    if (orderLines) {
      // Don't delete, just deactivate
      const product = await prisma.product.update({
        where: { id: parseInt(params.id) },
        data: { isActive: false },
      })
      return NextResponse.json(product)
    } else {
      // Safe to delete
      await prisma.product.delete({
        where: { id: parseInt(params.id) },
      })
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
