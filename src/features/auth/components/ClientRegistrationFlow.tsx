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
import { ROLE_NAMES } from "../types";
import { styles } from "./style/ClientRegistrationFlow.styles";

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

  // 🔥 nuevo: términos y condiciones
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  const validateForm = () => {
    if (!formData.name.trim()) return "Ingresa tu nombre.";
    if (/\d/.test(formData.name)) return "El nombre no puede contener números.";

    if (!formData.lastName.trim()) return "Ingresa tu apellido.";
    if (/\d/.test(formData.lastName))
      return "El apellido no puede contener números.";

    if (!formData.document.trim()) return "Ingresa tu documento de identidad.";

    if (!formData.phone.trim()) return "Ingresa tu número de teléfono.";
    if (!/^\d{10}$/.test(formData.phone))
      return "Ingresa un número de teléfono válido (10 dígitos).";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      return t?.errEmail || "Ingresa un correo electrónico válido.";
    if (formData.password.length < 6)
      return (
        t?.clientErrPassword ||
        "La contraseña debe tener al menos 6 caracteres."
      );
    if (formData.password !== formData.confirmPassword)
      return t?.clientErrPasswordMatch || "Las contraseñas no coinciden.";

    if (!acceptedTerms)
      return "Debes aceptar los Términos y Condiciones para continuar.";

    return "";
  };

  const handleRegister = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await authService.registerClient({
        name: formData.name,
        lastName: formData.lastName,
        document: formData.document,
        phone: formData.phone, // 🔥 nuevo
        email: formData.email,
        password: formData.password,
      });

      setLoading(false);
      onSuccess();
    } catch (err: any) {
      setLoading(false);
      if (__DEV__) {
        console.log("ERROR REAL DE FETCH:", err);
      }
      setError(err.message || "Error al conectar con el servidor.");
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
          {t?.clientRegistrationTitle || "Crear Cuenta"}
        </Text>
      </View>

      <Text style={[styles.subtitle, { color: themeColors.mutedText }]}>
        {t?.clientRegistrationSubtitle ||
          "Regístrate para pedir tus platos favoritos más rápido."}
      </Text>

      <AuthInput
        label="Nombre"
        placeholder="Ej. Marcos"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        themeColors={themeColors}
      />

      <AuthInput
        label="Apellido"
        placeholder="Ej. García"
        value={formData.lastName}
        onChangeText={(text) => setFormData({ ...formData, lastName: text })}
        themeColors={themeColors}
      />

      <AuthInput
        label="Documento de Identidad"
        placeholder="Ej. 12345678"
        value={formData.document}
        onChangeText={(text) =>
          setFormData({ ...formData, document: text.replace(/[^0-9]/g, "") })
        }
        themeColors={themeColors}
        keyboardType="numeric"
      />

      <AuthInput
        label="Teléfono"
        placeholder="Ej. 3001234567"
        value={formData.phone}
        onChangeText={(text) =>
          setFormData({ ...formData, phone: text.replace(/[^0-9]/g, "") })
        }
        themeColors={themeColors}
        keyboardType="phone-pad"
        maxLength={10}
      />

      <AuthInput
        label={t?.emailLabel || "Correo Electrónico"}
        placeholder={t?.clientEmailPlaceholder || "correo@ejemplo.com"}
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        themeColors={themeColors}
      />

      <AuthInput
        label={t?.passwordLabel || "Contraseña"}
        placeholder={
          t?.clientPasswordPlaceholder || "Crea una contraseña segura"
        }
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
        secureTextEntry={!showPassword}
        showPasswordToggle={true}
        onTogglePassword={() => setShowPassword(!showPassword)}
        themeColors={themeColors}
      />

      <AuthInput
        label={t?.clientConfirmPasswordLabel || "Confirmar Contraseña"}
        placeholder={
          t?.clientConfirmPasswordPlaceholder || "Repite tu contraseña"
        }
        value={formData.confirmPassword}
        onChangeText={(text) =>
          setFormData({ ...formData, confirmPassword: text })
        }
        secureTextEntry={!showConfirmPassword}
        showPasswordToggle={true}
        onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
        themeColors={themeColors}
      />

      {/* 🔥 CHECKBOX TÉRMINOS Y CONDICIONES */}
      <TouchableOpacity
        style={styles.termsRow}
        activeOpacity={0.7}
        onPress={() => setAcceptedTerms(!acceptedTerms)}
      >
        <View
          style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}
        >
          {acceptedTerms && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
        <Text style={[styles.termsText, { color: themeColors.text }]}>
          Acepto los{" "}
          <Text
            style={styles.termsLink}
            onPress={() => setTermsModalVisible(true)}
          >
            Términos y Condiciones
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
            {t?.clientRegisterButton || "Registrarme"}
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
                Términos y Condiciones
              </Text>
              <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
                <Ionicons name="close" size={26} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.modalBodyText, { color: themeColors.text }]}>
                {TERMS_TEXT}
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
                Aceptar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
