/* global describe, test, expect, beforeEach, vi */

import { render, screen, fireEvent } from '@testing-library/react'
import Blog from './Blog'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import BlogForm from './BlogForm'
describe('<Blog />', () => {
  const blog = {
    title: 'React Patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 5,
    user: {
      username: 'user1',
      name: 'User One'
    }
  }

  test('renders title and author, but not url or likes by default', () => {
    render(<Blog blog={blog} />)

    // عنوان و نویسنده باید دیده شوند
    expect(screen.getByText('React Patterns Michael Chan')).toBeInTheDocument()

    // url و likes نباید دیده شوند
    expect(screen.queryByText('https://reactpatterns.com/')).not.toBeInTheDocument()
    expect(screen.queryByText('likes 5')).not.toBeInTheDocument()
  })
  test('<Blog /> shows url and likes when view button is clicked', async () => {
    const blog = {
      title: 'React Patterns',
      author: 'Michael Chan',
      url: 'https://reactpatterns.com/',
      likes: 5,
      user: { name: 'User One' },
    }

    render(<Blog blog={blog} />)

    const button = screen.getByText('view')
    await userEvent.click(button)

    // مطمئن شو url و likes نمایش داده شده‌اند
    expect(screen.getByText('https://reactpatterns.com/')).toBeInTheDocument()
    expect(screen.getByText(/likes\s*5/)).toBeInTheDocument()
  })
  test('calls the like handler twice when like button is clicked twice', async () => {
    const blog = {
      title: 'React Patterns',
      author: 'Michael Chan',
      url: 'https://reactpatterns.com/',
      likes: 5,
      user: {
        name: 'User One'
      }
    }

    const handleLike = vi.fn() // ساخت تابع mock

    const { container } = render(
      <Blog blog={blog} handleLike={handleLike} />
    )

    const user = userEvent.setup()

    // ابتدا نمایش جزئیات را فعال می‌کنیم تا دکمه like دیده شود
    const viewButton = screen.getByText('view')
    await user.click(viewButton)

    const likeButton = screen.getByText('like')
    await user.click(likeButton)
    await user.click(likeButton)

    expect(handleLike).toHaveBeenCalledTimes(2)
  })
  test('calls createBlog with right details when form is submitted', async () => {
    const createBlog = vi.fn()
    render(<BlogForm createBlog={createBlog} />)

    const user = userEvent.setup()
    const titleInput = screen.getByLabelText(/title/i)
    const authorInput = screen.getByLabelText(/author/i)
    const urlInput = screen.getByLabelText(/url/i)
    const submitButton = screen.getByText(/create/i)

    await user.type(titleInput, 'New Blog Title')
    await user.type(authorInput, 'New Author')
    await user.type(urlInput, 'https://newblog.com')
    await user.click(submitButton)

    expect(createBlog).toHaveBeenCalledTimes(1)
    expect(createBlog).toHaveBeenCalledWith({
      title: 'New Blog Title',
      author: 'New Author',
      url: 'https://newblog.com'
    })
  })
})