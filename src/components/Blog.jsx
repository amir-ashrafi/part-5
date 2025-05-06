import { useState } from 'react'

const Blog = ({ blog, handleLike,handleDelete,user }) => {
  const [visible, setVisible] = useState(false)

  const blogStyle = {
    padding: 10,
    border: 'solid',
    borderWidth: 1,
    marginBottom: 5
  }

  const toggleVisibility = () => setVisible(!visible)
  const likeBlog = () => handleLike(blog)

  return (
    <div style={blogStyle} className="blog">
      <div>
        {blog.title} {blog.author}
        <button onClick={toggleVisibility}>
          {visible ? 'hide' : 'view'}
        </button>
      </div>
      {visible && (
        <div className="blogDetails">
          <div>{blog.url}</div>
          <div className="likes">
            likes {blog.likes}
            <button id='likes' onClick={likeBlog}>like</button>
          </div>
          <div>{blog.user?.name}</div>
          {
            user?.username === blog.user?.username && (
              <button onClick={() => handleDelete(blog)}>remove</button>
            )
          }

        </div>
      )}
    </div>
  )
}

export default Blog