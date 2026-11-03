import { useWindowDimensions, View, Text, TouchableOpacity, FlatList, ScrollView, LayoutAnimation, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { getClientLocale } from "@/features/userPreferences/context/ClientPreferencesContext";
import type { ClientDashboardModel } from "./useClientDashboard";
export function ClientCatalog({ model }: { model: ClientDashboardModel }) {
const { width } = useWindowDimensions();
const columns = width >= 900 ? 2 : 1;
const { styles, colors, t, language, branchError, deliveryBranch, products, loadingCatalog, resolvingLocation, activeCategory, setActiveCategory, handleOpenLocationPicker, localizeCategoryName, categoryNames, filteredMenu, handleItemPress } = model;
return (<>{/* CATEGORÍAS: solo si la sede tiene productos */}
        {products.length > 0 && (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
            >
              {categoryNames.map((cat, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryBtn,
                    activeCategory === cat && styles.categoryBtnActive,
                  ]}
                  onPress={() => {
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut,
                    );
                    setActiveCategory(cat);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      activeCategory === cat && styles.categoryTextActive,
                    ]}
                  >
                    {cat === "__all__" ? t("all") : localizeCategoryName(cat)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* MENÚ PRINCIPAL */}
        <FlatList
          key={columns}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? { gap: 16 } : undefined}
          data={filteredMenu}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.menuList}
          ListEmptyComponent={
            resolvingLocation || loadingCatalog ? (
              <View style={{ alignItems: "center", padding: 40, gap: 12 }}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={{ color: colors.muted }}>
                  {resolvingLocation ? t("nearestBranch") : t("loadingMenu")}
                </Text>
              </View>
            ) : !deliveryBranch ? (
              <View style={{ alignItems: "center", padding: 32, gap: 12 }}>
                <Ionicons name="location-outline" size={48} color="#94A3B8" />
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  {branchError ? t("noCoverage") : t("chooseAddress")}
                </Text>
                <TouchableOpacity
                  onPress={handleOpenLocationPicker}
                  style={{
                    backgroundColor: "#E61C24",
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>
                    {t("useLocation")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text
                style={{
                  textAlign: "center",
                  color: colors.muted,
                  padding: 32,
                }}
              >
                {t("noProducts")}
              </Text>
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.menuCard}
              activeOpacity={0.7}
              onPress={() => handleItemPress(item)}
            >
              <View style={styles.menuCardImagePlaceholder}>
                {item.image ? (
                  <ExpoImage
                    source={{ uri: item.image }}
                    style={{ width: "100%", height: "100%", borderRadius: 12 }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={120}
                    recyclingKey={item.image}
                  />
                ) : (
                  <Text style={{ fontSize: 40 }}>🍽️</Text>
                )}
              </View>
              <View style={styles.menuCardInfo}>
                <Text style={styles.menuCardTitle}>{item.name}</Text>
                <Text style={styles.menuCardDesc} numberOfLines={2}>
                  {item.desc}
                </Text>
                <View style={styles.menuCardFooter}>
                  <Text style={styles.menuCardPrice}>
                    ${item.price.toLocaleString(getClientLocale(language))}
                  </Text>
                  <View style={styles.addButton}>
                    <Ionicons name="add" size={20} color="#FFF" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        </>);
}
