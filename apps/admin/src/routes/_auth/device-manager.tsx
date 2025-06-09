import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/device-manager')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_auth/device-manager"!</div>;
}
