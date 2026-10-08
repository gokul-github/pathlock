import { createFileRoute } from "@tanstack/react-router";
import { Lab } from "@/components/pathlock/lab";

export const Route = createFileRoute("/")({
  component: Lab,
});
