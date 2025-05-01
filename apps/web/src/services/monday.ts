interface MondayResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations: Array<{
      line: number;
      column: number;
    }>;
    path: string[];
  }>;
}

interface Workspace {
  id: string;
  name: string;
}

interface Board {
  id: string;
  name: string;
  columns: Column[];
}

interface Column {
  id: string;
  title: string;
  type: string;
}

export class MondayService {
  private readonly apiVersion = '2025-01';
  private readonly baseUrl = 'https://api.monday.com/v2';

  constructor(private readonly accessToken: string) {}

  private async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.accessToken,
        'API-Version': this.apiVersion,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`Monday.com API request failed: ${response.statusText}`);
    }

    const result = (await response.json()) as MondayResponse<T>;

    if (result.errors) {
      throw new Error(`Monday.com API error: ${result.errors[0].message}`);
    }

    return result.data;
  }

  async getGroups(): Promise<Array<{ id: string; name: string }>> {
    const query = `
      query {
        workspaces {
          id
          name
        }
      }
    `;

    const result = await this.query<{ workspaces: Workspace[] }>(query);
    return result.workspaces.map(workspace => ({
      id: workspace.id,
      name: workspace.name,
    }));
  }

  async getBoards(groupId: string): Promise<Board[]> {
    const query = `
      query($workspaceId: ID!) {
        boards(workspace_ids: [$workspaceId]) {
          id
          name
          columns {
            id
            title
            type
          }
        }
      }
    `;

    const result = await this.query<{ boards: Board[] }>(query, { workspaceId: groupId });
    return result.boards;
  }
}
