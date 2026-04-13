import CategoryDetail from './CategoryDetail'

export default function CategoriaPage({ params }) {
  return <CategoryDetail slug={params.slug} />
}
