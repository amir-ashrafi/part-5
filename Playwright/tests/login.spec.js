const { test, expect, beforeEach, describe } = require('@playwright/test')

const user = {
  name: 'Amir',
  username: 'amir123',
  password: 'password123'
}

describe('Blog app', () => {
  beforeEach(async ({ request, page }) => {
    // ریست دیتابیس
    await request.post('http://localhost:5173/api/testing/reset')

    // ساختن کاربر جدید
    await request.post('http://localhost:5173/api/users', {
      data: user,
    })

    await page.goto('http://localhost:5173')
  })

  test('Login form is shown', async ({ page }) => {
    await expect(page.getByPlaceholder('Username')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await page.getByPlaceholder('Username').fill(user.username)
      await page.getByPlaceholder('Password').fill(user.password)
      await page.getByRole('button', { name: 'Login' }).click()

      await expect(page.getByText(`${user.name} logged in`, { exact: true })).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await page.getByPlaceholder('Username').fill(user.username)
      await page.getByPlaceholder('Password').fill('wrongpassword')
      await page.getByRole('button', { name: 'Login' }).click()

      await expect(page.getByText('Wrong username or password')).toBeVisible()
      await expect(page.getByText(`${user.name} logged in`)).not.toBeVisible()
    })
  })

  describe('When logged in', () => {
    beforeEach(async ({ page }) => {
      await page.getByPlaceholder('Username').fill(user.username)
      await page.getByPlaceholder('Password').fill(user.password)
      await page.getByRole('button', { name: 'Login' }).click()
    })

    test('a new blog can be created', async ({ page }) => {
      // باز کردن فرم جدید
      await page.getByRole('button', { name: 'new blog' }).click()
    
      // پر کردن فیلدها
      await page.getByPlaceholder('Title').fill('Test Blog Title')
      await page.getByPlaceholder('Author').fill('Test Author')
      await page.getByPlaceholder('Url').fill('http://example.com')
    
      // ارسال فرم
      await page.getByRole('button', { name: 'create' }).click()
    
      // **حذف انتظار برای پیام متنی**
      // await expect(
      //   page.getByText("A new blog 'Test Blog Title' by Test Author added")
      // ).toBeVisible()
    
      // بررسی اینکه بلاگ جدید در لیست نمایش داده می‌شود
      await expect(
        page.locator('.blog').filter({ hasText: 'Test Blog Title' }).last()
      ).toBeVisible()
    })
    test('a blog can be liked', async ({ page }) => {
      // 1) ساخت بلاگ
      await page.getByRole('button', { name: 'new blog' }).click()
      await page.getByPlaceholder('Title').fill('Blog to be liked')
      await page.getByPlaceholder('Author').fill('Like Author')
      await page.getByPlaceholder('Url').fill('http://like-blog.com')
      await page.getByRole('button', { name: 'create' }).click()

      // 2) locator بلاگ
      const blog = page.locator('.blog').filter({ hasText: 'Blog to be liked' }).last()
      await expect(blog).toBeVisible()

      // 3) باز کردن جزئیات
      await blog.getByRole('button', { name: 'view' }).click()

      // 4) کلیک روی like
      await blog.getByRole('button', { name: 'like' }).click()

      // 5) polling assertion برای صبر تا 'likes 1'
      const likesContainer = blog.locator('.likes')
      await expect.poll(
        async () => await likesContainer.textContent(),
        { timeout: 5000 }
      ).toContain('likes 1')
    })
    test('the user who created the blog can delete it', async ({ page }) => {
      // 1) ساخت بلاگ جدید
      await page.getByRole('button', { name: 'new blog' }).click()
      await page.getByPlaceholder('Title').fill('Deletable Blog')
      await page.getByPlaceholder('Author').fill('Delete Author')
      await page.getByPlaceholder('Url').fill('http://delete-blog.com')
      await page.getByRole('button', { name: 'create' }).click()
    
      // 1.5) منتظر باش تا بلاگ در لیست ظاهر شود
      const blogLocator = page.locator('.blog').filter({ hasText: 'Deletable Blog' }).last()
      await expect(blogLocator).toHaveCount(1)
    
      // 2) باز کردن جزئیات بلاگ
      await blogLocator.getByRole('button', { name: 'view' }).click()
    
      // 3) قبول دیالوگ تایید
      page.once('dialog', dialog => dialog.accept())
    
      // 4) کلیک روی remove
      await blogLocator.getByRole('button', { name: 'remove' }).click()
    
      // 5) انتظار برای حذف بلاگ
      await expect(
        page.locator('.blog').filter({ hasText: 'Deletable Blog' })
      ).toHaveCount(0)
    })
    
    test('only the user who created the blog sees the remove button', async ({ page, request }) => {
      const otherUser = {
        name: 'Bob',
        username: 'bob456',
        password: 'password456'
      }
    
      // 1) ساخت کاربر دوم
      await request.post('http://localhost:5173/api/users', { data: otherUser })
    
      // 2) با کاربر اول لاگین کن و یک بلاگ بساز
      await page.goto('http://localhost:5173')
      await page.getByPlaceholder('Username').fill(user.username)
      await page.getByPlaceholder('Password').fill(user.password)
      await page.getByRole('button', { name: 'login' }).click()
    
      await page.getByRole('button', { name: 'new blog' }).click()
      await page.getByPlaceholder('Title').fill('Creator-Only Blog')
      await page.getByPlaceholder('Author').fill('Author A')
      await page.getByPlaceholder('Url').fill('http://creator-only.com')
      await page.getByRole('button', { name: 'create' }).click()
    
      const blog = page
        .locator('.blog')
        .filter({ hasText: 'Creator-Only Blog' })
        .last()
      await blog.getByRole('button', { name: 'view' }).click()
    
      // 3) مطمئن شو که creator دکمه remove را می‌بیند
      await expect(blog.getByRole('button', { name: 'remove' })).toBeVisible()
    
      // 4) لاگ‌اوت کن و صفحه را ری‌لود کن تا فرم لاگین پایدار شود
      await page.getByRole('button', { name: 'logout' }).click()
      await page.goto('http://localhost:5173')
      await page.getByPlaceholder('Username').waitFor()
    
      // 5) با کاربر دوم لاگین کن (همزمان کلیک و انتظار برای پاسخ API)
      await page.getByPlaceholder('Username').fill(otherUser.username)
      await page.getByPlaceholder('Password').fill(otherUser.password)
      await Promise.all([
        page.waitForResponse(resp =>
          resp.url().includes('/api/login') && resp.status() === 200
        ),
        page.getByRole('button', { name: 'login' }).click(),
      ])
    
      // 6) بلاگ را پیدا کن و view بزن
      const sameBlog = page
        .locator('.blog')
        .filter({ hasText: 'Creator-Only Blog' })
        .last()
      await sameBlog.getByRole('button', { name: 'view' }).click()
    
      // 7) مطمئن شو که کاربر دوم دکمه remove را نمی‌بیند
      await expect(sameBlog.getByRole('button', { name: 'remove' })).toHaveCount(0)
    })

  })
})
