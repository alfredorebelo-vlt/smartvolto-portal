import { DirectoryProvider } from './types';
import { MockDirectoryProvider } from './mock-provider';
import { GoogleWorkspaceDirectoryProvider } from './google-workspace-provider';

export type { DirectoryUser, DirectoryFilter } from './types';
export type { DirectoryProvider } from './types';

export function getDirectoryProvider(): DirectoryProvider {
  if (
    process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL &&
    process.env.GOOGLE_WORKSPACE_PRIVATE_KEY
  ) {
    return new GoogleWorkspaceDirectoryProvider(
      process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL,
      process.env.GOOGLE_WORKSPACE_PRIVATE_KEY,
      process.env.GOOGLE_WORKSPACE_DOMAIN ?? "voltodrive.com"
    );
  }
  return new MockDirectoryProvider();
}
