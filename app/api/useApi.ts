import { useState } from "react";

type GraphQLResponse<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  call: (args?: {
    variables?: Record<string, any>;
    query?: string;
  }) => Promise<T | null>;
};

const API_URL = process.env.API_URL || "http://localhost:4000/graphql";

export function useApi<T = any>(
  initialQuery?: string,
  defaultVariables?: Record<string, any>
): GraphQLResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const call = async ({
    variables = defaultVariables,
    query = initialQuery,
  }: {
    variables?: Record<string, any>;
    query?: string;
  } = {}): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
      });

      const json = await res.json();

      if (json.errors) {
        const message = json.errors[0]?.message || "Unknown error";
        setError(message);
        setLoading(false);
        return null;
      }

      setData(json.data);
      setLoading(false);
      return json.data;
    } catch (err: any) {
      setError(err.message || "Network error");
      setLoading(false);
      return null;
    }
  };

  return { data, error, loading, call };
}
