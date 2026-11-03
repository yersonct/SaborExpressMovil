import { useWaiterDashboardData } from "./waiter-dashboard-data";
import { useWaiterTableActions } from "./waiter-dashboard-tables";
import { useWaiterCartActions } from "./waiter-dashboard-cart";
import { useWaiterSubmit } from "./waiter-dashboard-submit";
export function useWaiterDashboardModel(){
const data=useWaiterDashboardData();
const tables=useWaiterTableActions(data);
const cart=useWaiterCartActions(data);
const submit=useWaiterSubmit(data);
return {...data,...tables,...cart,...submit};
}
export type WaiterDashboardModel=ReturnType<typeof useWaiterDashboardModel>;
