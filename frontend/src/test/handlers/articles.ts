import { http, HttpResponse } from "msw"
import {
  mockArticles,
  mockCategories,
  mockIngredients,
  mockArticleIngredients,
} from "../mocks/articles"

const API = "*/api"

export const articleHandlers = [
  // Articles list
  http.get(`${API}/articles/`, () => {
    return HttpResponse.json({
      count: mockArticles.length,
      next: null,
      previous: null,
      results: mockArticles,
    })
  }),

  // Article detail
  http.get(`${API}/articles/:id/`, ({ params }) => {
    const id = Number(params.id)
    const article = mockArticles.find((a) => a.id === id)
    if (!article) return HttpResponse.json({ detail: "Non trouvé" }, { status: 404 })
    return HttpResponse.json(article)
  }),

  // Create article
  http.post(`${API}/articles/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 100, ...body }, { status: 201 })
  }),

  // Update article (PUT)
  http.put(`${API}/articles/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: Number(params.id), ...body })
  }),

  // Partial update article (PATCH)
  http.patch(`${API}/articles/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: Number(params.id), ...body })
  }),

  // Delete article
  http.delete(`${API}/articles/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Categories list
  http.get(`${API}/categories/`, () => {
    return HttpResponse.json({
      count: mockCategories.length,
      next: null,
      previous: null,
      results: mockCategories,
    })
  }),

  // Create category
  http.post(`${API}/categories/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 100, ...body }, { status: 201 })
  }),

  // Update category
  http.put(`${API}/categories/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: Number(params.id), ...body })
  }),

  // Delete category
  http.delete(`${API}/categories/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Ingredients list
  http.get(`${API}/ingredients/`, () => {
    return HttpResponse.json({
      count: mockIngredients.length,
      next: null,
      previous: null,
      results: mockIngredients,
    })
  }),

  // Create ingredient
  http.post(`${API}/ingredients/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 100, ...body }, { status: 201 })
  }),

  // Update ingredient
  http.put(`${API}/ingredients/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: Number(params.id), ...body })
  }),

  // Delete ingredient
  http.delete(`${API}/ingredients/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Article-ingredients list
  http.get(`${API}/article-ingredients/`, () => {
    return HttpResponse.json({
      count: mockArticleIngredients.length,
      next: null,
      previous: null,
      results: mockArticleIngredients,
    })
  }),

  // Create article-ingredient
  http.post(`${API}/article-ingredients/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 100, ...body }, { status: 201 })
  }),

  // Delete article-ingredient
  http.delete(`${API}/article-ingredients/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
