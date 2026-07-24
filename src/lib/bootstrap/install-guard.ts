import { redirect } from "next/navigation";
import { inspectInstallationState } from "@/lib/bootstrap/install-state";

export function requireInstallation() {
  if (inspectInstallationState().status !== "installed") redirect("/install");
}