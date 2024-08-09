import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { errorMessage } from "./error-handler"

export async function prismaUniqueHandler<T>(prismaQueryFunction: () => Promise<T>, message: string) {
  try {
    return await prismaQueryFunction()
  } catch (err) {
    const errorGeneral = err as any
    if (err instanceof PrismaClientKnownRequestError && err.code == 'P2002') {
      throw errorMessage(400, message)
    }
    throw errorMessage(500, errorGeneral.message)
  }
}