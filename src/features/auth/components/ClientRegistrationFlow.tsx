import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { AuthInput } from "./AuthInput";
import { Ionicons } from "@expo/vector-icons";
import { authService } from "../services/authService";
import { styles } from "./style/ClientRegistrationFlow.styles";
import { getMobileTermsAndConditions, translateMobileCopy } from "../../../locales/mobileCopy";

interface ClientRegistrationFlowProps {
  onSuccess: () => void;
  onCancel: () => void;
  themeColors: any;
  t: any;
}

// 🔥 Texto placeholder — reemplázalo cuando tengas el definitivo
const TERMS_TEXT = `Términos y Condiciones de SaborExpress

1. Aceptación: al crear una cuenta en SaborExpress, aceptas estos términos y nuestra política de tratamiento de datos personales.

2. Uso del servicio: la app permite realizar pedidos de comida a domicilio o para recoger en sede. El usuario es responsable de la veracidad de los datos suministrados (nombre, documento, teléfono, correo).

3. Pagos: los pedidos se pagan mediante los métodos habilitados en la app. SaborExpress no almacena datos completos de tarjetas.

4. Datos personales: tu información se usa únicamente para gestionar pedidos, contacto de entrega y notificaciones del servicio, conforme a la Ley 1581 de 2012 (Colombia).

5. Responsabilidad: SaborExpress no se hace responsable por retrasos causados por terceros (repartidores externos, fuerza mayor, etc.).

6. Modificaciones: estos términos pueden actualizarse. Se notificará a los usuarios ante cambios importantes.

Al marcar la casilla "Acepto los Términos y Condiciones", confirmas que has leído y aceptas lo anterior.`;

export const ClientRegistrationFlow: React.FC<ClientRegistrationFlowProps> = ({
  onSuccess,
  onCancel,
  themeColors,
  t,
}) => {
  const termsText = getMobileTermsAndConditions() || TERMS_TEXT;
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    document: "",
    phone: "", // 🔥 nuevo
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 🔥 nuevo: términos y condiciones
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = translateMobileCopy("Ingresa tu nombre.");
    else if (/\d/.test(formData.name)) errors.name = translateMobileCopy("El nombre no puede contener números.");
    if (!formData.lastName.trim()) errors.lastName = translateMobileCopy("Ingresa tu apellido.");
    else if (/\d/.test(formData.lastName)) errors.lastName = translateMobileCopy("El apellido no puede contener números.");
    if (formData.phone.trim() && !/^(?:\d{7}|\d{10})$/.test(formData.phone.trim())) {
      errors.phone = t?.errPhone || translateMobileCopy("Ingresa un teléfono fijo de 7 dígitos o un celular de 10 dígitos.");
    }
    if (!formData.email.trim()) errors.email = translateMobileCopy("Ingresa un correo electrónico.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = t?.errEmail || translateMobileCopy("Ingresa un correo electrónico válido.");
    }
    if (!formData.password) errors.password = t?.passwordRequired || translateMobileCopy("Ingresa tu contraseña.");
    else if (formData.password.length < 8) {
      errors.password = t?.clientErrPassword || translateMobileCopy("La contraseña debe tener al menos 8 caracteres.");
    }
    if (!formData.confirmPassword) errors.confirmPassword = t?.confirmPasswordRequired || translateMobileCopy("Confirma tu contraseña.");
    else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t?.clientErrPasswordMatch || translateMobileCopy("Las contraseñas no coinciden.");
    }
    return {
      errors,
      formError: !acceptedTerms
        ? translateMobileCopy("Debes aceptar los Términos y Condiciones para continuar.")
        : "",
    };
  };

  const handleRegister = async () => {
    const validation = validateForm();
    setFieldErrors(validation.errors);
    if (validation.formError || Object.keys(validation.errors).length > 0) {
      setError(validation.formError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      await authService.registerClient({
        name: formData.name.trim(),
        lastName: formData.lastName.trim(),
        document: formData.document.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      setLoading(false);
      onSuccess();
    } catch (err: any) {
      setLoading(false);
      if (__DEV__) {
        console.log("ERROR REAL DE FETCH:", err);
      }
      setError(translateMobileCopy(err.message || "Error al conectar con el servidor."));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onCancel}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text }]}>
          {t?.clientRegistrationTitle || translateMobileCopy("Crear Cuenta")}
        </Text>
      </View>

      <Text style={[styles.subtitle, { color: themeColors.mutedText }]}>
        {t?.clientRegistrationSubtitle ||
          translateMobileCopy("Regístrate para pedir tus platos favoritos más rápido.")}
      </Text>

      <AuthInput
        label={`${translateMobileCopy("Nombre")} *`}
        placeholder={translateMobileCopy("Ej. Marcos")}
        value={formData.name}
        onChangeText={(text) => { setFormData({ ...formData, name: text }); setFieldErrors((current) => ({ ...current, name: "" })); setError(""); }}
        error={!!fieldErrors.name}
        errorMessage={fieldErrors.name}
        maxLength={120}
        themeColors={themeColors}
      />

      <AuthInput
        label={`${translateMobileCopy("Apellido")} *`}
        placeholder={translateMobileCopy("Ej. García")}
        value={formData.lastName}
        onChangeText={(text) => { setFormData({ ...formData, lastName: text }); setFieldErrors((current) => ({ ...current, lastName: "" })); setError(""); }}
        error={!!fieldErrors.lastName}
        errorMessage={fieldErrors.lastName}
        maxLength={120}
        themeColors={themeColors}
      />

      <AuthInput
        label={t?.clientDocumentLabel || translateMobileCopy("Documento de Identidad")}
        placeholder={translateMobileCopy("Ej. 12345678")}
        value={formData.document}
        onChangeText={(text) => {
          setFormData({ ...formData, document: text.replace(/[^0-9]/g, "") });
          setError("");
        }}
        themeColors={themeColors}
        keyboardType="numeric"
        maxLength={20}
      />

      <AuthInput
        label={t?.clientPhoneLabel || translateMobileCopy("Teléfono")}
        placeholder={translateMobileCopy("Ej. 3001234567")}
        value={formData.phone}
        onChangeText={(text) => { setFormData({ ...formData, phone: text.replace(/[^0-9]/g, "") }); setFieldErrors((current) => ({ ...current, phone: "" })); setError(""); }}
        themeColors={themeColors}
        keyboardType="phone-pad"
        maxLength={10}
        error={!!fieldErrors.phone}
        errorMessage={fieldErrors.phone}
      />

      <AuthInput
        label={`${t?.emailLabel || translateMobileCopy("Correo Electrónico")} *`}
        placeholder={t?.clientEmailPlaceholder || "correo@ejemplo.com"}
        value={formData.email}
        onChangeText={(text) => { setFormData({ ...formData, email: text }); setFieldErrors((current) => ({ ...current, email: "" })); setError(""); }}
        themeColors={themeColors}
        keyboardType="email-address"
        maxLength={254}
        error={!!fieldErrors.email}
        errorMessage={fieldErrors.email}
      />

      <AuthInput
        label={`${t?.passwordLabel || translateMobileCopy("Contraseña")} *`}
        placeholder={
          t?.clientPasswordPlaceholder || "Crea una contraseña segura"
        }
        value={formData.password}
        onChangeText={(text) => { setFormData({ ...formData, password: text }); setFieldErrors((current) => ({ ...current, password: "" })); setError(""); }}
        secureTextEntry={!showPassword}
        showPasswordToggle={true}
        onTogglePassword={() => setShowPassword(!showPassword)}
        themeColors={themeColors}
        error={!!fieldErrors.password}
        errorMessage={fieldErrors.password}
      />

      <AuthInput
        label={`${t?.clientConfirmPasswordLabel || translateMobileCopy("Confirmar contraseña")} *`}
        placeholder={
          t?.clientConfirmPasswordPlaceholder || "Repite tu contraseña"
        }
        value={formData.confirmPassword}
        onChangeText={(text) => { setFormData({ ...formData, confirmPassword: text }); setFieldErrors((current) => ({ ...current, confirmPassword: "" })); setError(""); }}
        secureTextEntry={!showConfirmPassword}
        showPasswordToggle={true}
        onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
        themeColors={themeColors}
        error={!!fieldErrors.confirmPassword}
        errorMessage={fieldErrors.confirmPassword}
      />

      {/* 🔥 CHECKBOX TÉRMINOS Y CONDICIONES */}
      <TouchableOpacity
        style={styles.termsRow}
        activeOpacity={0.7}
        onPress={() => { setAcceptedTerms(!acceptedTerms); setError(""); }}
      >
        <View
          style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}
        >
          {acceptedTerms && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
        <Text style={[styles.termsText, { color: themeColors.text }]}>
          {translateMobileCopy("Acepto los")}{" "}
          <Text
            style={styles.termsLink}
            onPress={() => setTermsModalVisible(true)}
          >
            {translateMobileCopy("Términos y Condiciones")}
          </Text>
        </Text>
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#E61C24"
          style={{ marginTop: 20 }}
        />
      ) : (
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: themeColors.buttonBackground },
          ]}
          onPress={handleRegister}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.submitButtonText, { color: themeColors.buttonText }]}
          >
            {t?.clientRegisterButton || translateMobileCopy("Registrarme")}
          </Text>
        </TouchableOpacity>
      )}

      {/* 🔥 MODAL DE TÉRMINOS Y CONDICIONES */}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: themeColors.background || "#FFFFFF" },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                {translateMobileCopy("Términos y Condiciones")}
              </Text>
              <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
                <Ionicons name="close" size={26} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.modalBodyText, { color: themeColors.text }]}>
                {termsText}
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={[
                styles.modalAcceptButton,
                { backgroundColor: themeColors.buttonBackground },
              ]}
              onPress={() => {
                setAcceptedTerms(true);
                setTermsModalVisible(false);
              }}
            >
              <Text
                style={[
                  styles.modalAcceptButtonText,
                  { color: themeColors.buttonText },
                ]}
              >
                {translateMobileCopy("Aceptar")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
