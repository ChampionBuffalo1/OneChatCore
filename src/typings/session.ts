export interface JwtPayload {
  userId: string;
}

type socketdata = {
  // GROUP_DELETE
  group: {
    id: string;
    name?: string;
    // GROUP_JOIN
    iconUrl?: string | null;
    description?: string | null;
  };
} & (
  | {
      // GROUP_LEAVE
      user: {
        id: string;
        username: string;
      };
      id: string;
    }
  | {
      // ICON_CHANGE
      url: string;
    }
  | {
      // GROUP_JOIN
      id: string;
      user: {
        id: string;
        username: string;
      };
    }
  | {
      // MESSAGE_EDIT & MESSAGE_CREATE & MESSAGE_DELETE
      id: string;
      createdAt: Date;
      updatedAt: Date;
      text: string;
      author: {
        id: string;
        username: string;
        avatarUrl: string | null;
      };
    }
  | {
      // Only the default type and nothing else.
      // Required for GROUP_DELETE
    }
);

interface SocketPayload {
  d: socketdata;
  op:
    | 'GROUP_LEAVE'
    | 'GROUP_DELETE'
    | 'ICON_CHANGE'
    | 'GROUP_JOIN'
    | 'MESSAGE_EDIT'
    | 'MESSAGE_CREATE'
    | 'MESSAGE_DELETE';
}

declare global {
  namespace Express {
    interface Request {
      payload: JwtPayload;
      socketPayload: SocketPayload;
    }
  }
}
