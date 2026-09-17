import {createClient,SupabaseAuthAdapter} from '@neondatabase/neon-js';

const AUTH_URL='https://ep-dry-cell-avlzxkzn.neonauth.c-11.us-east-1.aws.neon.tech/neondb/auth';
const DATA_API_URL='https://ep-dry-cell-avlzxkzn.apirest.c-11.us-east-1.aws.neon.tech/freshfresh/rest/v1';

export const neon=createClient({
  auth:{adapter:SupabaseAuthAdapter(),url:AUTH_URL},
  dataApi:{url:DATA_API_URL}
});

export async function currentSession(){
  const {data}=await neon.auth.getSession();
  return data?.session??data??null;
}
