// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available

import { Payload, PayloadRequest } from 'payload'
import { snackSeedData } from './snacks'

// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  try {
    // Create snacks with placeholder image URLs
    const snackPromises = snackSeedData.map(async (snack) => {
      return await payload.create({
        collection: 'snacks',
        data: {
          name: snack.name,
          description: snack.description,
          price: snack.price,
          category: snack.category,
          available: snack.available,
          imageUrl: snack.imageUrl,
        },
        req,
      })
    })

    const createdSnacks = await Promise.all(snackPromises)

    payload.logger.info(
      `Successfully created ${createdSnacks.length} snacks with placeholder images`,
    )
  } catch (error) {
    payload.logger.error('Error running seed migration:', error)
    throw error
  }
}
