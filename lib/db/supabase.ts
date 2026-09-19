// Supabase Client with graceful fallback to local JSON repository
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
}

export const supabaseConfig: SupabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pamvopgliynzmoamdvkp.supabase.co",
  anonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbXZvcGdsaXluem1vYW1kdmtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NDYxMTEsImV4cCI6MjEwNTQyMjExMX0.Yz4FCvB7kayq8SqbiWtq_59dqjFDl_SJbEo2-KLZa8Y",
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

export async function fetchFromSupabase<T>(table: string, queryParams: string = ""): Promise<T[] | null> {
  try {
    const url = `${supabaseConfig.url}/rest/v1/${table}?${queryParams}`;
    const res = await fetch(url, {
      headers: {
        apikey: supabaseConfig.anonKey,
        Authorization: `Bearer ${supabaseConfig.anonKey}`,
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as T[];
  } catch (e) {
    console.warn(`[Supabase] Query to ${table} failed, falling back to local files:`, e);
    return null;
  }
}
