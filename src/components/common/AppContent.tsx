import { AuthGuard } from "../auth/AuthGuard";
import { AppRoutes } from "../../routes";
import { RootLayout } from "../ui/space-background";
import { CosmoContainer } from "../cosmo/CosmoContainer";

function AppContent() {
  return (
    <AuthGuard>
      <RootLayout>
        <AppRoutes />
        <CosmoContainer />
      </RootLayout>
    </AuthGuard>
  );
}

export default AppContent;