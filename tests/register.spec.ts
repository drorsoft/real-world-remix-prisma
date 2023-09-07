import type { Page } from '@playwright/test'
import { test as base, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'

class HomePage {
  constructor(public readonly page: Page) {}

  async assertHeading() {
    await expect(
      this.page.getByRole('heading', { name: /conduit/i })
    ).toBeVisible()
  }
}

class RegisterPage {
  constructor(public readonly page: Page) {}

  async goTo() {
    await this.page.goto('/register')

    await this.assertHeading()
  }

  async assertHeading() {
    await expect(
      this.page.getByRole('heading', { name: /Sign up/i })
    ).toBeVisible()
  }

  async fillName(fullName?: string) {
    await this.page
      .getByRole('textbox', { name: /Your Name/i })
      .fill(fullName || 'Yoav Sagi')
  }

  async fillEmail(email?: string) {
    await this.page
      .getByRole('textbox', { name: /Email/i })
      .fill(email || 'test@test.com')
  }

  async fillPassword(password: string = 'Aa123456!') {
    await this.page.getByRole('textbox', { name: /Password/i }).fill(password)
  }

  async fillRequiredFields() {
    await this.fillName()
    await this.fillEmail()
    await this.fillPassword()
  }

  async submit() {
    await this.page.getByRole('button', { name: /Sign up/i }).click()
  }
}

const test = base.extend<{ registerPage: RegisterPage; homePage: HomePage }>({
  registerPage: async ({ page }, use) => {
    const registerPage = new RegisterPage(page)
    await use(registerPage)
  },
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page)
    await use(homePage)
  },
})

test('a guest can register for an account with valid credentials', async ({
  registerPage,
  homePage,
}) => {
  // Arrange
  await registerPage.goTo()

  // Act
  await registerPage.fillRequiredFields()

  await registerPage.submit()

  // Assert
  await homePage.assertHeading()
})

test("a guest can't register for an account without credentials", async ({
  page,
}) => {
  // Arrange
  await page.goto('/register')

  await expect(page.getByRole('heading', { name: /Sign up/i })).toBeVisible()

  // Act
  await page.getByRole('button', { name: /Sign up/i }).click()

  // Assert
  await expect(page.getByRole('heading', { name: /Sign up/i })).toBeVisible()

  await expect(
    page.getByRole('alert', { name: /name error message/i })
  ).toContainText("name can't be blank")

  await expect(
    page.getByRole('alert', { name: /email error message/i })
  ).toContainText("email can't be blank")

  await expect(
    page.getByRole('alert', { name: /password error message/i })
  ).toContainText("password can't be blank")
})

test("a guest can't register for an account with an invalid email", async ({
  page,
}) => {
  // Arrange
  await page.goto('/register')

  await expect(page.getByRole('heading', { name: /Sign up/i })).toBeVisible()

  // Act
  const fullName = faker.person.fullName()
  const email = 'test@test,com'

  await page.getByRole('textbox', { name: /Your Name/i }).fill(fullName)
  await page.getByRole('textbox', { name: /Email/i }).fill(email)
  await page.getByRole('textbox', { name: /Password/i }).fill('Aa123456!')

  await page.getByRole('button', { name: /Sign up/i }).click()

  // Assert
  await expect(page.getByRole('heading', { name: /Sign up/i })).toBeVisible()

  await expect(
    page.getByRole('alert', { name: /email error message/i })
  ).toContainText('email must be valid')
})
