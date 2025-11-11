export const runtime = "nodejs";
export async function GET(request: Request) {
    const token = process.env.FOOTBALL_DATA_API_TOKEN;
  
    try {
      const response = await fetch("https://api.football-data.org/v4/competitions", {
        headers: {
          "X-Auth-Token": token || "",
          "User-Agent": "fixturecompare-debug/1.0",
        },
      });
  
      const text = await response.text();
  
      return new Response(
        JSON.stringify({
          status: response.status,
          ok: response.ok,
          origin: request.headers.get("host"),
          footballDataResponse: text,
        }),
        {
          headers: { "content-type": "application/json" },
          status: 200,
        }
      );
    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { "content-type": "application/json" },
        }
      );
    }
  }
