import express from 'express'
import { Lokka } from 'lokka'
import { Transport } from 'lokka-transport-http'

const client = new Lokka({
  transport: new Transport('https://api.graph.cool/simple/v1/cixppm9cl0im50169lsgk7g2o')
})

const fetchHistory = () => (
  client.query(`
    {
      allSearches(orderBy: createdAt_DESC) {
        createdAt
        query
      }
    }
  `)
)

const fetchImages = (filter = `{description_contains: ""}`, offset = 0) => (
  client.query(`
    {
      allPosts(first:10, filter: ${filter}, skip: ${offset}) {
        imageUrl
        description
      }
    }
  `)
)

const addToHistory = (query) => (
  client.mutate(`
    {
      createSearch(query: "${query}") {
        query
      }
    }
  `)
)

const createFilter = (query) => {
  let array = query.split(' ')
  let filter = `{description_contains: "${array[0]}"`
  if (array.length > 1) {
    array.slice(1).forEach((term) => {
      filter += `, AND: {description_contains: "${term}"`
    })
  }
  array.forEach(() => {
    filter += `}`
  })
  return filter
}

const dbCall = (query, offset) => {
  let filter = createFilter(query)
  addToHistory(query)
  return fetchImages(filter).then(res => res)
}

const app = express()

app.get('/', (req, res) => {
  let search = req.query.search
  let offset = req.query.offset || 0
  let filter = (search) ? createFilter(search) : `{description_contains: ""}`
  if (search) {
    addToHistory(search)
  }
  fetchImages(filter, offset).then(results => res.json(results))
})

app.get('/history', (req, res) => {
  fetchHistory().then(results => res.json(results))
})

app.listen(process.env.PORT || 5000)
