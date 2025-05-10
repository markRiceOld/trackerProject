import React from "react";
import ReactDOM from "react-dom/client";
import App from "./root";

async function start() {
  const root = document.getElementById("root")!;
  const { ApolloClient, InMemoryCache, ApolloProvider } = await import("@apollo/client");

  const client = new ApolloClient({
    uri: "http://localhost:4000/graphql",
    cache: new InMemoryCache(),
  });

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </React.StrictMode>
  );
}

start();

