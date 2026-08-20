import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import { useAuthenticatedQuery } from "../hooks/useAuthenticatedQuery";
import { useConfig } from "../config/useConfig";
import { useAuth0 } from "@auth0/auth0-react";
import { createAuthenticatedFetcher } from "../auth/api";
import { createWidget, getWidgets } from "../queries/widgets";

export default function HomePage() {
  const config = useConfig();
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const widgetsQuery = useAuthenticatedQuery({
    queryKey: ["widgets"],
    queryFn: (fetcher) => getWidgets(config, fetcher),
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const fetcher = createAuthenticatedFetcher(
        config,
        getAccessTokenSilently,
      );
      return createWidget(config, fetcher, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
      setName("");
      setDescription("");
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || null,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card title="Create widget">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
              Name
            </span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sprocket"
              required
              maxLength={255}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
              Description
            </span>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="optional"
              maxLength={1024}
            />
          </label>
          <div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving…" : "Create widget"}
            </Button>
          </div>
          {createMutation.isError ? (
            <p className="text-sm text-error-700" role="alert">
              Failed to create widget: {createMutation.error.message}
            </p>
          ) : null}
        </form>
      </Card>

      <Card title="Widgets">
        {widgetsQuery.isLoading ? (
          <p>Loading widgets…</p>
        ) : widgetsQuery.isError ? (
          <p className="text-error-700" role="alert">
            Failed to load widgets: {widgetsQuery.error.message}
          </p>
        ) : widgetsQuery.data.length === 0 ? (
          <p className="text-neutral-600">
            No widgets yet — create one above to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {widgetsQuery.data.map((widget) => (
              <li
                key={widget.id}
                className="flex flex-col gap-1 rounded-md border border-line px-3 py-2"
              >
                <span className="text-sm font-semibold text-ink">
                  {widget.name}
                </span>
                {widget.description ? (
                  <span className="text-xs text-neutral-600">
                    {widget.description}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
