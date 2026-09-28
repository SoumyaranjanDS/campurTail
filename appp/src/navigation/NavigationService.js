import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export function handleNotificationRoute(data) {
  if (!data || !data.incidentId) return;
  
  if (data.type === 'chat') {
    navigate('IssueChat', { incidentId: data.incidentId });
  } else {
    navigate('ReportDetail', { incidentId: data.incidentId });
  }
}
