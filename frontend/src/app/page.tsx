// app/page.tsx
import React from "react";

type Update = {
  id: number;
  title: string;
  link: string;
};

async function fetchUpdates(): Promise<{ updates: Update[]; error: string | null }> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  try {
    const response = await fetch(`${backendUrl}/rss-updates`, { cache: "no-store" }); // Prevent caching
    if (!response.ok) {
      throw new Error(`Failed to fetch updates. HTTP status: ${response.status}`);
    }
    const updates = await response.json();
    return { updates, error: null };
  } catch (err) {
    console.error("Error fetching RSS updates:", err);
    return { updates: [], error: "Failed to fetch RSS updates. Please try again later." };
  }
}

export default async function Home() {
  const { updates, error } = await fetchUpdates(); // Fetch data directly in the Server Component

  return (
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h1>RSS Feed Updates</h1>
        {error ? (
            <p style={{ color: "red" }}>{error}</p>
        ) : updates.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {updates.map((update) => (
                  <li key={update.id} style={{ marginBottom: "10px" }}>
                    <a href={update.link} target="_blank" rel="noopener noreferrer">
                      {update.title}
                    </a>
                  </li>
              ))}
            </ul>
        ) : (
            <p>No updates available. Please check back later.</p>
        )}
      </div>
  );
}
