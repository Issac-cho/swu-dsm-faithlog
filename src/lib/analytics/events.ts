export const eventNames = ['page_view', 'check_complete', 'check_uncomplete', 'reading_memo_save', 'application_memo_save', 'commitment_save', 'review_save', 'history_tab', 'other_history_open', 'save_failed', 'delete_failed'] as const
export type EventName = typeof eventNames[number]

export function normalizePage(path: string): string {
  return path.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')
}

export const actionNames = ['toggleRecord', 'updateRecordMemo', 'deleteCustomItem', 'addCustomItem', 'saveReflection', 'updateProfile', 'renameCell', 'deleteCell', 'createCell', 'assignUserToCell', 'assignShepherd', 'removeShepherd', 'updateTalentPolicy', 'updateCommunityPassword', 'removeMember', 'changeMemberRole', 'resetCommunityTalents', 'createBonusPolicy', 'deleteBonusPolicy', 'leaveCommunity', 'claimPerfectWeekBonus'] as const
