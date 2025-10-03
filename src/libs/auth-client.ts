import axios from 'axios'
import { AxiosInstance } from 'axios'
import { accountClient } from '@/api/appwrite'

export default class AuthClient {
  static async getInstance(): Promise<AxiosInstance> {
    const user = await accountClient.createJWT()
    const client = axios.create({
      headers: {
        'BMCOACH-JWT': user.jwt,
      },
    })
    return client
  }
}
