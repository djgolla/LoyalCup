import axios from 'axios'
import { supabase } from '../lib/supabase'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// cache session to avoid repeated getSession calls
let cachedSession = null
let sessionFetchPromise = null

const getSessionWithCache = async () => {
  // if we already have a fresh session, use it
  if (cachedSession && cachedSession.expires_at && cachedSession.expires_at > Date.now() / 1000) {
    return cachedSession
  }
  
  // if a fetch is already in progress, wait for it
  if (sessionFetchPromise) {
    return sessionFetchPromise
  }
  
  // fetch fresh session
  sessionFetchPromise = supabase.auth.getSession().then(({ data }) => {
    cachedSession = data.session
    sessionFetchPromise = null
    return cachedSession
  })
  
  return sessionFetchPromise
}

// request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const session = await getSessionWithCache()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // server responded with error status
      console.error('API Error:', error.response.data)
    } else if (error.request) {
      // request made but no response
      console.error('Network Error:', error.message)
    } else {
      // something else happened
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)

export default api
