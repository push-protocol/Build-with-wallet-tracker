import { Resolution } from "@unstoppabledomains/resolution";
import 'dotenv/config'

const UD_API_KEY = process.env.UD_API_KEY;

export async function resolveUD(domain, currency='ETH') {
  try {
    const resolution = new Resolution({
      apiKey: UD_API_KEY,
    });

    const resolvedAddress = await resolution.addr(domain, currency)

    return resolvedAddress;
  } catch (error) {
    return { error: true, message: "Error while resolving ENS address" };
  }
}
