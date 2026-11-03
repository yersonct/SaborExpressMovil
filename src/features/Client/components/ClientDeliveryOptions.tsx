import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { branchAvailabilityLabel, branchHoursLabel } from "@/features/branches/utils/branchAvailability";
import { BranchesMapModal } from "@/features/branches/components/BranchesMapModal";
import { LocationPickerModal } from "@/features/branches/components/LocationPickerModal";
import type { ClientDashboardModel } from "./useClientDashboard";
export function ClientDeliveryOptions({ model }: { model: ClientDashboardModel }) {
const { colors, t, isDark, language, router, addresses, loadingAddresses, selectedAddressId, showAddressPicker, setShowAddressPicker, showAllAddresses, setShowAllAddresses, showBranchesMap, setShowBranchesMap, showLocationPicker, setShowLocationPicker, savingMapLocation, setSavingMapLocation, showDeliveryOptions, setShowDeliveryOptions, manualBranch, setManualBranch, ADDRESS_PREVIEW_COUNT, visibleAddresses, hiddenCount, liveLocation, coordsForBranch, nearestBranch, loadingBranch, deliveryBranch, branchUnavailable, branchClosedMessage, radiusMsgs, saveLocationAsAddress, handleSelectAddress, handleOpenBranchPicker, handleOpenLocationPicker, handleOpenDeliveryOptions, switchDeliveryOptionsTo, cartModalVisible, outOfRadius, radiusText } = model;
return (<>{/* SELECTOR DE DIRECCIÓN */}
        {!loadingAddresses && (
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: isDark ? "#3B2024" : "#FEF2F2",
              gap: 8,
            }}
            onPress={handleOpenLocationPicker}
          >
            <Ionicons name="location" size={18} color={colors.accent} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.text,
                flex: 1,
              }}
              numberOfLines={1}
            >
              <Text>{t("deliverTo")} </Text>
              <Text style={{ color: colors.accent }}>
                {addresses.find((a) => a.id === selectedAddressId)
                  ?.addressLine ?? t("addAddress")}
              </Text>
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.muted} />
          </TouchableOpacity>
        )}

        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: colors.background,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="map-outline" size={16} color={colors.accent} />
            <Text
              style={{ fontSize: 12, color: colors.muted, flex: 1 }}
              numberOfLines={1}
            >
              {(loadingBranch && !manualBranch)
                ? t("nearestBranch")
                : deliveryBranch
                  ? `${t("orderFrom")} ${deliveryBranch.name}${liveLocation ? ` (${t("currentLocation")})` : ""}`
                  : t("noBranch")}
            </Text>
            <TouchableOpacity
              onPress={handleOpenDeliveryOptions}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 7,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.accent,
              }}
              accessibilityRole="button"
            >
              <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "700" }}>
                {t("changeDelivery")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          transparent
          visible={showAddressPicker}
          animationType="fade"
          onRequestClose={() => setShowAddressPicker(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 20,
                maxHeight: "60%",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  marginBottom: 12,
                  color: colors.text,
                }}
              >
                {t("whereDeliver")}
              </Text>

              {addresses.length === 0 ? (
                <Text style={{ color: colors.muted, marginBottom: 12 }}>
                  {t("noAddresses")}
                </Text>
              ) : (
                <>
                  <ScrollView style={{ maxHeight: 280 }}>
                    {visibleAddresses.map((a) => (
                      <TouchableOpacity
                        key={a.id}
                        style={{
                          padding: 14,
                          borderRadius: 10,
                          backgroundColor:
                            selectedAddressId === a.id
                              ? isDark
                                ? "#312020"
                                : "#FEF2F2"
                              : colors.background,
                          marginBottom: 8,
                        }}
                        onPress={() => handleSelectAddress(a.id)}
                      >
                        <Text style={{ fontWeight: "700", color: colors.text }}>
                          {a.addressLine}
                        </Text>
                        {a.reference ? (
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.muted,
                              marginTop: 2,
                            }}
                          >
                            {a.reference}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {addresses.length > ADDRESS_PREVIEW_COUNT && (
                    <TouchableOpacity
                      style={{ alignItems: "center", padding: 10 }}
                      onPress={() => setShowAllAddresses((v) => !v)}
                    >
                      <Text
                        style={{
                          color: isDark ? "#93C5FD" : "#3B82F6",
                          fontWeight: "700",
                        }}
                      >
                        {showAllAddresses
                          ? t("seeLess")
                          : `${t("all")} (${hiddenCount})`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              <TouchableOpacity
                style={{
                  marginTop: 8,
                  alignItems: "center",
                  padding: 12,
                  backgroundColor: isDark ? "#312020" : "#FEF2F2",
                  borderRadius: 10,
                }}
                onPress={() => {
                  setShowAddressPicker(false);
                  router.push("/client/addresses");
                }}
              >
                <Text style={{ color: colors.accent, fontWeight: "700" }}>
                  {t("addNewAddress")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: 8, alignItems: "center", padding: 10 }}
                onPress={() => setShowAddressPicker(false)}
              >
                <Text style={{ color: colors.muted, fontWeight: "600" }}>
                  {t("close")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal
          transparent
          visible={showDeliveryOptions}
          animationType="fade"
          onRequestClose={() => setShowDeliveryOptions(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              padding: 24,
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: 20,
                gap: 12,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>
                {t("deliveryOptionsTitle")}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  switchDeliveryOptionsTo(handleOpenLocationPicker);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="location-outline" size={22} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "700" }}>
                    {t("changeLocation")}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>
                    {t("deliveryAddressOptionDesc")}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  switchDeliveryOptionsTo(handleOpenBranchPicker);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="storefront-outline" size={22} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "700" }}>
                    {t("changeBranch")}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>
                    {t("deliveryBranchOptionDesc")}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDeliveryOptions(false)}
                style={{ alignSelf: "flex-end", paddingHorizontal: 12, paddingVertical: 8 }}
              >
                <Text style={{ color: colors.accent, fontWeight: "700" }}>
                  {t("cancel")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {branchUnavailable && deliveryBranch && (
          <View style={{ marginHorizontal: 16, marginBottom: 8, padding: 12,
            borderRadius: 10, backgroundColor: "#FEF2F2", borderColor: "#FCA5A5", borderWidth: 1 }}>
            <Text style={{ color: "#991B1B", fontWeight: "800" }}>
              {branchAvailabilityLabel(deliveryBranch, language)}
            </Text>
            <Text style={{ marginTop: 3, color: "#991B1B", fontSize: 12 }}>
              {branchHoursLabel(deliveryBranch, language)}
            </Text>
            <Text style={{ marginTop: 3, color: "#991B1B", fontSize: 12 }}>
              {branchClosedMessage}
            </Text>
          </View>
        )}
        {outOfRadius && !cartModalVisible && (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 8,
              padding: 12,
              borderRadius: 10,
              backgroundColor: "#FEE2E2",
              borderWidth: 1,
              borderColor: "#FCA5A5",
            }}
          >
            <Text
              style={{ color: "#991B1B", fontWeight: "700", marginBottom: 2 }}
            >
              {radiusMsgs.radiusTitle}
            </Text>
            <Text style={{ color: "#991B1B", fontSize: 12 }}>{radiusText}</Text>
            <TouchableOpacity
              onPress={handleOpenDeliveryOptions}
              style={{ alignSelf: "flex-start", marginTop: 8, paddingVertical: 4 }}
              accessibilityRole="button"
            >
              <Text style={{ color: "#7F1D1D", fontSize: 12, fontWeight: "800" }}>
                {t("changeDelivery")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <BranchesMapModal
          visible={showBranchesMap}
          onClose={() => setShowBranchesMap(false)}
          nearestBranchId={nearestBranch?.id}
          selectedBranchId={deliveryBranch?.id}
          onSelectBranch={(branch) => {
            setManualBranch(
              branch.id === nearestBranch?.id ? null : branch,
            );
          }}
          userLocation={
            coordsForBranch
              ? {
                  latitude: coordsForBranch.latitude,
                  longitude: coordsForBranch.longitude,
                }
              : null
          }
        />

        <LocationPickerModal
          visible={showLocationPicker}
          onClose={() => { if (!savingMapLocation) setShowLocationPicker(false); }}
          savedAddresses={addresses}
          selectedAddressId={selectedAddressId}
          saving={savingMapLocation}
          onChooseSavedAddress={(id) => {
            void handleSelectAddress(id);
            setShowLocationPicker(false);
          }}
          initialLocation={
            coordsForBranch
              ? {
                  latitude: coordsForBranch.latitude,
                  longitude: coordsForBranch.longitude,
                }
              : null
          }
          onConfirm={(coords, exactAddress) => {
            if (savingMapLocation) return;
            setSavingMapLocation(true);
            void saveLocationAsAddress(coords, true, exactAddress)
              .then((saved) => {
                if (saved) setShowLocationPicker(false);
              })
              .finally(() => setSavingMapLocation(false));
          }}
        />
        </>);
}
