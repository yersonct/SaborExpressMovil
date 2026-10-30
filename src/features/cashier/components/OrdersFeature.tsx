import { View } from "react-native";
import { styles } from "../style/CashierStyles";
import { useCashierOrdersModel } from "./cashier-orders-model";
import { CashierOrdersList } from "./CashierOrdersList";
import { CashierPaymentModal } from "./CashierPaymentModal";
import { CashierOrdersCatalog } from "./CashierOrdersCatalog";
export function OrdersFeature(props:Parameters<typeof useCashierOrdersModel>[0]){
const model=useCashierOrdersModel(props);
return (<View style={styles.content}>
<CashierOrdersList model={model} />
<CashierPaymentModal model={model} />
<CashierOrdersCatalog model={model} />
</View>);
}
