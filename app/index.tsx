import { useRootNavigationState, Redirect } from 'expo-router';


export default function Index() {
  const rootNavigationState = useRootNavigationState();

  if (!rootNavigationState?.key) return null;

  return <Redirect href={"/(main)" as any} />;
}
