import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "./router";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
