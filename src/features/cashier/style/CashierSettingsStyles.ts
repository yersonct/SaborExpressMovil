import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: { 
    flex: 1 
  },
  topHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1 
  },
  topHeaderTitle: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  container: { 
    padding: 20, 
    paddingBottom: 40 
  },
  header: { 
    marginBottom: 30 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '900', 
    marginBottom: 5 
  },
  subtitle: { 
    fontSize: 15 
  },
  section: { 
    marginBottom: 25 
  },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    marginBottom: 12, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  card: { 
    borderRadius: 20, 
    paddingHorizontal: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 5, 
    elevation: 2 
  },
  settingRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 18 
  },
  settingInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  textGroup: { 
    marginLeft: 15, 
    flex: 1 
  },
  settingTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 2 
  },
  settingDesc: { 
    fontSize: 13 
  },
  divider: { 
    height: 1 
  },

  // 🔥 ESTILOS ORIGINALES DE IDIOMA 🔥
  languageSelectorContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingBottom: 20, 
    paddingTop: 5 
  },
  langButton: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 10, 
    marginHorizontal: 4, 
    borderRadius: 10, 
    borderWidth: 1 
  },
  langButtonText: { 
    fontSize: 14, 
    fontWeight: 'bold' 
  },

  // 🔥 NUEVOS ESTILOS DE LA PASTILLA DE MODO OSCURO 🔥
  themeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 50,
    padding: 4,
    height: 48,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 50,
  },
  activeLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeDark: {
    backgroundColor: '#0B1220',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  themeIcon: {
    fontSize: 16,
  },
  themeTextLight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 6,
  },
  themeTextDark: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 6,
  }
});
