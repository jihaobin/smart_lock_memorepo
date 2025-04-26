import { useQueryClient } from '@tanstack/react-query';

import { useApi } from '@/contexts/ApiContext';
import queryClient from '@/lib/queryClient';

export default function useFriendData() {
  const { queryHooks, apiClient } = useApi();

  const { data: allGroupNamesData } = queryHooks.useApiQuery(['allGroupNames'], '/friend/groups');

  const { data: allFriendData } = queryHooks.useApiQuery(['allFriend'], 'getAllFriend');
}
