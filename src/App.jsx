import { useState, useEffect, useRef } from 'react'
import Blog from './components/Blog'
import Togglable from './components/Togglable'
import BlogForm from './components/BlogForm'
import Notification from './components/Notification'
import blogService from './services/blogs'
import loginService from './services/login'

const App = () => {
  const [blogs, setBlogs] = useState([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [notification, setNotification] = useState(null)
  const [notifType, setNotifType] = useState('success')

  const blogFormRef = useRef()

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  useEffect(() => {
    const loggedJSON = window.localStorage.getItem('loggedBlogAppUser')
    if (loggedJSON) {
      const user = JSON.parse(loggedJSON)
      setUser(user)
      blogService.setToken(user.token)
    }
  }, [])

  useEffect(() => {
    if (user) {
      blogService.getAll().then(setBlogs)
    }
  }, [user])

  const handleLogin = async event => {
    event.preventDefault()
    try {
      const userData = await loginService.login({ username, password })
      window.localStorage.setItem('loggedBlogAppUser', JSON.stringify(userData))
      setUser(userData)
      blogService.setToken(userData.token)
      setUsername('')
      setPassword('')
      showNotification(`${userData.name} logged in`, 'success')
    } catch {
      showNotification('Wrong username or password', 'error')
    }
  }

  const handleLogout = () => {
    window.localStorage.removeItem('loggedBlogAppUser')
    setUser(null)
    setBlogs([])
    showNotification('Logged out', 'success')
  }

  const addBlog = async blogObject => {
    try {
      const createdBlog = await blogService.create(blogObject)
      setBlogs(blogs.concat(createdBlog))
      showNotification(
        `A new blog '${createdBlog.title}' by ${createdBlog.author} added`,
        'success'
      )
      blogFormRef.current.toggleVisibility()
    } catch {
      showNotification('Error creating blog', 'error')
    }
  }

  // Fix handleLike to preserve user details after PUT
  const handleLike = async blog => {
    const updatedBlogForServer = {
      user: blog.user.id || blog.user._id,
      likes: blog.likes + 1,
      author: blog.author,
      title: blog.title,
      url: blog.url
    }
    try {
      const returnedBlog = await blogService.update(blog.id, updatedBlogForServer)
      // Preserve full user object since backend returns only id
      returnedBlog.user = blog.user
      setBlogs(blogs.map(b => (b.id === blog.id ? returnedBlog : b)))
    } catch {
      showNotification('Error liking blog', 'error')
    }
  }
  const handleDelete = async (blog) => {
    const ok = window.confirm(`Remove blog "${blog.title}" by ${blog.author}?`)
    if (!ok) return

    try {
      await blogService.remove(blog.id)
      setBlogs(blogs.filter(b => b.id !== blog.id))
      showNotification(`Deleted blog "${blog.title}"`, 'success')
    } catch {
      showNotification('Error deleting blog', 'error')
    }
  }
  if (!user) {
    return (
      <div>
        <Notification message={notification?.message} type={notification?.type} />
        <h2>Log in to application</h2>
        <form onSubmit={handleLogin}>
          <div>
            username
            <input
              placeholder='Username'
              value={username}
              onChange={({ target }) => setUsername(target.value)}
            />
          </div>
          <div>
            password
            <input
              placeholder='Password'
              type="password"
              value={password}
              onChange={({ target }) => setPassword(target.value)}
            />
          </div>
          <button className='LOGIN' type="submit">login</button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <Notification message={notification?.message} type={notification?.type} />
      <h2>blogs</h2>
      <p>
        {user.name} logged in <button className='LOGOUT' onClick={handleLogout}>logout</button>
      </p>
      <Togglable buttonLabel="new blog" ref={blogFormRef}>
        <BlogForm createBlog={addBlog} />
      </Togglable>
      {[...blogs]
        .sort((a, b) => b.likes - a.likes)
        .map(blog => (
          <Blog
            key={blog.id}
            blog={blog}
            handleLike={handleLike}
            handleDelete={handleDelete}
            user={user}
          />
        ))}
    </div>
  )
}

export default App
