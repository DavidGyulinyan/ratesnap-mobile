import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getSupabaseClient } from '@/lib/supabase-safe';
import { getAsyncStorage } from '@/lib/storage';
import expoGoSafeNotificationService from '@/lib/expoGoSafeNotificationService';
import ContactSupportModal from '@/components/ContactSupportModal';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const { themePreference, setThemePreference } = useTheme();

  // State for modals and forms
  const [showThemeSelection, setShowThemeSelection] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);

  // Account info form state
  const [accountInfo, setAccountInfo] = useState({
    username: user?.user_metadata?.username || user?.email?.split('@')[0] || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    sound: true,
    vibration: true,
    showPreview: true,
  });

  // Exchange rate data state
  const [exchangeRateData, setExchangeRateData] = useState<{
    time_last_update_utc?: string;
    time_next_update_utc?: string;
  } | null>(null);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');

  // Load notification settings and exchange rate data on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storage = getAsyncStorage();
        const savedSettings = await storage.getItem("notificationSettings");
        if (savedSettings) {
          setNotificationSettings(JSON.parse(savedSettings));
        }

        const cachedData = await storage.getItem("cachedExchangeRates");
        if (cachedData) {
          const data = JSON.parse(cachedData);
          setExchangeRateData({
            time_last_update_utc: data.time_last_update_utc,
            time_next_update_utc: data.time_next_update_utc,
          });
        } else {
          // Provide estimated times when no cached data is available
          const now = new Date();
          const lastUpdate = new Date(now.getTime() - (30 * 60 * 1000)); // 30 minutes ago
          const nextUpdate = new Date(now.getTime() + (30 * 60 * 1000)); // 30 minutes from now

          setExchangeRateData({
            time_last_update_utc: lastUpdate.toISOString(),
            time_next_update_utc: nextUpdate.toISOString(),
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        // Fallback to estimated times
        const now = new Date();
        const lastUpdate = new Date(now.getTime() - (60 * 60 * 1000)); // 1 hour ago
        const nextUpdate = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hour from now

        setExchangeRateData({
          time_last_update_utc: lastUpdate.toISOString(),
          time_next_update_utc: nextUpdate.toISOString(),
        });
      }
    };

    loadSettings();
  }, []);

  // Helper function to add opacity to hex colors
  const addOpacity = (hexColor: string, opacity: number) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert('Success', 'You have been signed out successfully.');
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  // Handle notification setting toggle
  const handleNotificationToggle = async (setting: keyof typeof notificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [setting]: !notificationSettings[setting]
    };
    setNotificationSettings(newSettings);

    try {
      const storage = getAsyncStorage();
      await storage.setItem("notificationSettings", JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  // Handle clear cache
  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached exchange rates and temporary data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            try {
              const storage = getAsyncStorage();
              await storage.removeItem('cachedExchangeRates');
              await storage.removeItem('lastApiCall');
              setExchangeRateData(null);
              Alert.alert('Success', 'Cache cleared successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache.');
            }
          }
        }
      ]
    );
  };

  // Handle export data
  const handleExportData = async () => {
    try {
      const storage = getAsyncStorage();
      const exportData = {
        exportDate: new Date().toISOString(),
        userInfo: user ? { email: user.email } : null,
        settings: { themePreference, language, notificationSettings },
        cachedRates: await storage.getItem('cachedExchangeRates'),
      };

      Alert.alert(
        'Data Export',
        `Data prepared for export. User: ${user?.email || 'Not logged in'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data.');
    }
  };

  // Get terms of use content
  const getCurrentTerms = () => {
    const terms = {
      en: `RateSnap Terms of Use

Effective Date: January 10, 2025

Welcome to RateSnap! By downloading, installing, or using our mobile application ("App"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms, please do not use the App.

1. SERVICE DESCRIPTION
RateSnap provides real-time currency conversion tools and exchange rate information for personal and informational purposes. Our services include:
• Live currency conversion between different currencies
• Historical exchange rate data
• Rate alerts and notifications
• Offline currency conversion capabilities

2. ACCEPTANCE OF TERMS
By accessing and using RateSnap, you accept and agree to be bound by the terms and provision of this agreement. These Terms apply to all users of the App.

3. USE LICENSE
Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, non-sublicensable license to:
• Download and install the App on your mobile device
• Access and use the App for personal, non-commercial purposes
• Access currency conversion features and exchange rate data

4. USER RESPONSIBILITIES
You agree to:
• Use the App only for lawful purposes
• Not use the App for any commercial activities without prior written consent
• Not attempt to reverse engineer, modify, or create derivative works of the App
• Not interfere with the proper functioning of the App
• Provide accurate information when required

5. ACCURACY DISCLAIMER
Exchange rates and conversion calculations are provided for informational purposes only. While we strive for accuracy, we do not guarantee that:
• Exchange rates are real-time or accurate
• Conversion calculations are error-free
• The App will be available at all times
• Currency data is up-to-date

6. LIMITATION OF LIABILITY
To the maximum extent permitted by applicable law, RateSnap and its developers shall not be liable for:
• Any direct, indirect, incidental, or consequential damages
• Loss of profits, data, or business opportunities
• Inaccuracies in exchange rate information
• Service interruptions or unavailability

7. DATA PRIVACY
Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the App, to understand our practices.

8. MODIFICATIONS TO TERMS
We reserve the right to modify these Terms at any time. We will notify users of significant changes through the App or email. Continued use of the App after changes constitutes acceptance of the new Terms.

9. TERMINATION
We may terminate or suspend your access to the App immediately, without prior notice, for any reason. Upon termination, your right to use the App will cease immediately.

10. GOVERNING LAW
These Terms shall be governed by and construed in accordance with applicable local laws, without regard to conflict of law provisions.

11. CONTACT INFORMATION
If you have any questions about these Terms, please contact us at support@ratesnap.app.

Thank you for choosing RateSnap!`,

      hy: `RateSnap-ի օգտագործման պայմանները

Ուժի մեջ մտնելու ամսաթիվը. հունվարի 10, 2025

Բարի գալուստ RateSnap: Մեր բջջային հավելվածը ("Հավելված") ներբեռնելով, տեղադրելով կամ օգտագործելով՝ դուք համաձայնում եք կապված լինել այս Օգտագործման Պայմաններով ("Պայմաններ"): Եթե դուք համաձայն չեք այս Պայմաններին, խնդրում ենք չօգտագործել Հավելվածը:

1. ԾԱՌԱՅՈՒԹՅԱՆ ՆԿԱՐԱԳՐՈՒԹՅՈՒՆ
RateSnap-ը ապահովում է իրական ժամանակի արժույթի փոխարկման գործիքներ և փոխարժեքների տեղեկատվություն անհատական և տեղեկատվական նպատակների համար: Մեր ծառայությունները ներառում են.
• Իրական ժամանակի արժույթի փոխարկում տարբեր արժույթների միջև
• Պատմական փոխարժեքների տվյալներ
• Դրույքաչափերի ազդանշաններ և ծանուցումներ
• Անցանց արժույթի փոխարկման հնարավորություններ

2. ՊԱՅՄԱՆՆԵՐԻ ՀԱՄԱՁԱՅՆՈՒԹՅՈՒՆ
RateSnap-ին մուտք գործելով և օգտագործելով՝ դուք ընդունում եք և համաձայնում եք կապված լինել այս համաձայնագրի պայմաններով և դրույթներով: Այս Պայմաններն առնչվում են Հավելվածի բոլոր օգտատերերին:

3. ՕԳՏԱԳՈՐԾՄԱՆ ԼԻՑԵՆԶԻԱ
Ձեր համապատասխանության պայմաններով այս Պայմաններին՝ մենք ձեզ շնորհում ենք սահմանափակ, ոչ բացառիկ, ոչ փոխանցելի, ոչ ենթալիցենզավորվող լիցենզիա՝
• Հավելվածը ներբեռնելու և տեղադրելու համար ձեր բջջային սարքում
• Մուտք գործելու և օգտագործելու Հավելվածը անհատական, ոչ առևտրային նպատակների համար
• Մուտք գործելու արժույթի փոխարկման առանձնահատկություններին և փոխարժեքների տվյալներին

4. ՕԳՏԱՏԵՐԻ ՊԱՏԱՍԽԱՆԱՏՎՈՒԹՅՈՒՆՆԵՐ
Դուք համաձայնում եք՝
• Հավելվածն օգտագործել միայն օրինական նպատակների համար
• Հավելվածն օգտագործել առևտրային գործունեության համար առանց նախկին գրավոր համաձայնության
• Չփորձել հետադարձ ինժեներական աշխատանքներ կատարել, փոփոխել կամ ստեղծել Հավելվածի ածանցյալ աշխատանքներ
• Չխանգարել Հավելվածի պատշաճ գործունեությանը
• Տրամադրել ճշգրիտ տեղեկատվություն, երբ պահանջվում է

5. ՃՇՏՈՒԹՅԱՆ ԵՐԱՇԽԻՔ
Փոխարժեքներն ու փոխարկման հաշվարկները տրամադրվում են միայն տեղեկատվական նպատակների համար: Մինչդեռ մենք ջանում ենք ճշտության համար, մենք երաշխավորում չենք տալիս, որ.
• Փոխարժեքներն իրական ժամանակի կամ ճշգրիտ են
• Փոխարկման հաշվարկներն առանց սխալների են
• Հավելվածը հասանելի կլինի միշտ
• Արժույթի տվյալները թարմացված են

6. ՊԱՏԱՍԽԱՆԱՏՎՈՒԹՅԱՆ ՍԱՀՄԱՆԱՓԱԿՈՒՄ
Կիրառելի օրենսդրության առավելագույն չափով, RateSnap-ը և նրա մշակողները չեն կրի պատասխանատվություն՝
• Որևէ անմիջական, անուղղակի, պատահական կամ հետևանքային վնասների համար
• Շահույթների, տվյալների կամ բիզնես հնարավորությունների կորստի համար
• Փոխարժեքների տեղեկատվության անճշտությունների համար
• Ծառայության ընդհատումների կամ անհասանելիության համար

7. ՏՎՅԱԼՆԵՐԻ ԳԱՂՏՆԱՊԱՏԻԿՈՒԹՅՈՒՆ
Ձեր գաղտնիությունը կարևոր է մեզ համար: Խնդրում ենք վերանայել մեր Գաղտնիության Քաղաքականությունը, որը նույնպես կարգավորում է Հավելվածի ձեր օգտագործումը՝ հասկանալու մեր պրակտիկան:

8. ՊԱՅՄԱՆՆԵՐԻ ՓՈՓՈԽՈՒԹՅՈՒՆՆԵՐ
Մենք իրավունք ենք վերապահում փոփոխելու այս Պայմանները ցանկացած ժամանակ: Մենք կտեղեկացնենք օգտատերերին էական փոփոխությունների մասին Հավելվածի կամ էլեկտրոնային փոստի միջոցով: Փոփոխություններից հետո Հավելվածի շարունակական օգտագործումը կազմում է նոր Պայմանների ընդունում:

9. ԴԱԴԱՐՈՒՄ
Մենք կարող ենք դադարեցնել կամ կասեցնել ձեր մուտքը Հավելված առանց նախկին ծանուցման, որևէ պատճառով: Դադարեցման դեպքում ձեր իրավունքը օգտագործել Հավելվածը կդադարի անմիջապես:

10. ԿԱՐԳԱՎՈՐՈՒՄ ԻՐԱՎՈՒՆՔ
Այս Պայմանները պետք է կարգավորվեն և մեկնաբանվեն կիրառելի տեղական օրենքների համաձայն, անկախ օրենքների կոնֆլիկտի դրույթներից:

11. ԿԱՊ ՄԱՆ ԻՆՖՈՐՄԱՑԻԱ
Եթե ունեք հարցեր այս Պայմանների վերաբերյալ, խնդրում ենք կապվել մեզ հետ support@ratesnap.app հասցեով:

Շնորհակալություն RateSnap-ն ընտրելու համար!`,

      ru: `Условия использования RateSnap

Дата вступления в силу: 10 января 2025 года

Добро пожаловать в RateSnap! Загружая, устанавливая или используя наше мобильное приложение ("Приложение"), вы соглашаетесь соблюдать настоящие Условия использования ("Условия"). Если вы не согласны с настоящими Условиями, пожалуйста, не используйте Приложение.

1. ОПИСАНИЕ СЕРВИСА
RateSnap предоставляет инструменты конвертации валюты и информацию о курсах обмена в реальном времени для личного и информационного использования. Наши услуги включают:
• Конвертацию валюты в реальном времени между различными валютами
• Исторические данные курсов обмена
• Оповещения о курсах и уведомления
• Возможности оффлайн-конвертации валюты

2. ПРИНЯТИЕ УСЛОВИЙ
Получая доступ к RateSnap и используя его, вы принимаете и соглашаетесь соблюдать условия и положения настоящего соглашения. Настоящие Условия применяются ко всем пользователям Приложения.

3. ЛИЦЕНЗИЯ НА ИСПОЛЬЗОВАНИЕ
При условии вашего соблюдения настоящих Условий, мы предоставляем вам ограниченную, неисключительную, непередаваемую, не подлежащую сублицензированию лицензию на:
• Загрузку и установку Приложения на ваше мобильное устройство
• Доступ и использование Приложения для личных, некоммерческих целей
• Доступ к функциям конвертации валюты и данным курсов обмена

4. ОБЯЗАННОСТИ ПОЛЬЗОВАТЕЛЯ
Вы соглашаетесь:
• Использовать Приложение только в законных целях
• Не использовать Приложение для какой-либо коммерческой деятельности без предварительного письменного согласия
• Не пытаться проводить обратное проектирование, модифицировать или создавать производные работы Приложения
• Не вмешиваться в надлежащее функционирование Приложения
• Предоставлять точную информацию при необходимости

5. ОТКАЗ ОТ ОТВЕТСТВЕННОСТИ ЗА ТОЧНОСТЬ
Курсы обмена и расчеты конвертации предоставляются только в информационных целях. Хотя мы стремимся к точности, мы не гарантируем, что:
• Курсы обмена являются актуальными или точными
• Расчеты конвертации не содержат ошибок
• Приложение будет доступно в любое время
• Данные валюты обновлены

6. ОГРАНИЧЕНИЕ ОТВЕТСТВЕННОСТИ
В максимально допустимой степени, разрешенной применимым законодательством, RateSnap и его разработчики не несут ответственности за:
• Любые прямые, косвенные, случайные или последующие убытки
• Потерю прибыли, данных или бизнес-возможностей
• Неточности в информации о курсах обмена
• Прерывания обслуживания или недоступность

7. КОНФИДЕНЦИАЛЬНОСТЬ ДАННЫХ
Ваша конфиденциальность важна для нас. Пожалуйста, ознакомьтесь с нашей Политикой конфиденциальности, которая также регулирует ваше использование Приложения, чтобы понять наши практики.

8. ИЗМЕНЕНИЯ УСЛОВИЙ
Мы оставляем за собой право изменять настоящие Условия в любое время. Мы будем уведомлять пользователей о существенных изменениях через Приложение или по электронной почте. Продолжение использования Приложения после изменений означает принятие новых Условий.

9. ПРЕКРАЩЕНИЕ
Мы можем прекратить или приостановить ваш доступ к Приложению немедленно, без предварительного уведомления, по любой причине. После прекращения ваше право на использование Приложения прекратится немедленно.

10. ПРИМЕНИМОЕ ЗАКОНОДАТЕЛЬСТВО
Настоящие Условия регулируются и толкуются в соответствии с применимым местным законодательством, без учета положений о конфликте законов.

11. КОНТАКТНАЯ ИНФОРМАЦИЯ
Если у вас есть вопросы по настоящим Условиям, пожалуйста, свяжитесь с нами по адресу support@ratesnap.app.

Спасибо за выбор RateSnap!`,

      es: `Términos de Uso de RateSnap

Fecha de entrada en vigor: 10 de enero de 2025

¡Bienvenido a RateSnap! Al descargar, instalar o usar nuestra aplicación móvil ("Aplicación"), aceptas estar sujeto a estos Términos de Uso ("Términos"). Si no aceptas estos Términos, por favor no uses la Aplicación.

1. DESCRIPCIÓN DEL SERVICIO
RateSnap proporciona herramientas de conversión de divisas e información de tipos de cambio en tiempo real para uso personal e informativo. Nuestros servicios incluyen:
• Conversión de divisas en tiempo real entre diferentes monedas
• Datos históricos de tipos de cambio
• Alertas de tipos y notificaciones
• Capacidades de conversión de divisas sin conexión

2. ACEPTACIÓN DE TÉRMINOS
Al acceder y usar RateSnap, aceptas y acuerdas estar sujeto a los términos y disposiciones de este acuerdo. Estos Términos se aplican a todos los usuarios de la Aplicación.

3. LICENCIA DE USO
Sujeto a tu cumplimiento de estos Términos, te otorgamos una licencia limitada, no exclusiva, no transferible, no sublicenciable para:
• Descargar e instalar la Aplicación en tu dispositivo móvil
• Acceder y usar la Aplicación para fines personales, no comerciales
• Acceder a las funciones de conversión de divisas y datos de tipos de cambio

4. RESPONSABILIDADES DEL USUARIO
Aceptas:
• Usar la Aplicación solo para fines legales
• No usar la Aplicación para actividades comerciales sin consentimiento previo por escrito
• No intentar realizar ingeniería inversa, modificar o crear obras derivadas de la Aplicación
• No interferir con el funcionamiento adecuado de la Aplicación
• Proporcionar información precisa cuando sea requerida

5. DESCARGO DE RESPONSABILIDAD DE PRECISIÓN
Los tipos de cambio y cálculos de conversión se proporcionan solo con fines informativos. Aunque nos esforzamos por la precisión, no garantizamos que:
• Los tipos de cambio sean en tiempo real o precisos
• Los cálculos de conversión estén libres de errores
• La Aplicación esté disponible en todo momento
• Los datos de divisas estén actualizados

6. LIMITACIÓN DE RESPONSABILIDAD
En la medida máxima permitida por la ley aplicable, RateSnap y sus desarrolladores no serán responsables de:
• Cualquier daño directo, indirecto, incidental o consecuente
• Pérdida de ganancias, datos u oportunidades de negocio
• Imprecisiones en la información de tipos de cambio
• Interrupciones del servicio o indisponibilidad

7. PRIVACIDAD DE DATOS
Tu privacidad es importante para nosotros. Por favor revisa nuestra Política de Privacidad, que también rige tu uso de la Aplicación, para entender nuestras prácticas.

8. MODIFICACIONES A LOS TÉRMINOS
Nos reservamos el derecho de modificar estos Términos en cualquier momento. Notificaremos a los usuarios sobre cambios significativos a través de la Aplicación o correo electrónico. El uso continuado de la Aplicación después de los cambios constituye aceptación de los nuevos Términos.

9. TERMINACIÓN
Podemos terminar o suspender tu acceso a la Aplicación inmediatamente, sin previo aviso, por cualquier razón. Tras la terminación, tu derecho a usar la Aplicación cesará inmediatamente.

10. LEY APLICABLE
Estos Términos se regirán e interpretarán de acuerdo con las leyes locales aplicables, sin tener en cuenta las disposiciones de conflicto de leyes.

11. INFORMACIÓN DE CONTACTO
Si tienes preguntas sobre estos Términos, por favor contáctanos en support@ratesnap.app.

¡Gracias por elegir RateSnap!`,

      zh: `RateSnap 使用条款

生效日期：2025年1月10日

欢迎使用 RateSnap！通过下载、安装或使用我们的移动应用程序（"应用程序"），您同意受本使用条款（"条款"）的约束。如果您不同意这些条款，请不要使用应用程序。

1. 服务描述
RateSnap 为个人和信息用途提供实时货币转换工具和汇率信息。我们的服务包括：
• 不同货币之间的实时货币转换
• 历史汇率数据
• 汇率警报和通知
• 离线货币转换功能

2. 条款接受
通过访问和使用 RateSnap，您接受并同意受本协议条款和规定的约束。这些条款适用于应用程序的所有用户。

3. 使用许可
在您遵守这些条款的前提下，我们授予您有限的、非独占的、不可转让的、不可再许可的许可，以：
• 在您的移动设备上下载和安装应用程序
• 出于个人、非商业目的访问和使用应用程序
• 访问货币转换功能和汇率数据

4. 用户责任
您同意：
• 仅将应用程序用于合法目的
• 未经事先书面同意，不将应用程序用于任何商业活动
• 不尝试对应用程序进行逆向工程、修改或创建衍生作品
• 不干扰应用程序的正常运行
• 在需要时提供准确信息

5. 准确性免责声明
汇率和转换计算仅供参考。虽然我们力求准确，但我们不保证：
• 汇率是实时的或准确的
• 转换计算没有错误
• 应用程序始终可用
• 货币数据是最新的

6. 责任限制
在适用法律允许的最大范围内，RateSnap 及其开发者不对以下内容承担责任：
• 任何直接、间接、偶然或后果性损害
• 利润、数据或商业机会的损失
• 汇率信息的不准确
• 服务中断或不可用

7. 数据隐私
您的隐私对我们很重要。请查看我们的隐私政策，该政策也管理您对应用程序的使用，以了解我们的做法。

8. 条款修改
我们保留随时修改这些条款的权利。我们将通过应用程序或电子邮件通知用户重大变更。变更后继续使用应用程序即构成对新条款的接受。

9. 终止
我们可能因任何原因立即终止或暂停您对应用程序的访问，恕不另行通知。终止后，您使用应用程序的权利将立即终止。

10. 适用法律
这些条款应受适用当地法律管辖并据其解释，不考虑法律冲突条款。

11. 联系信息
如果您对这些条款有任何疑问，请通过 support@ratesnap.app 与我们联系。

感谢您选择 RateSnap！`,

      hi: `RateSnap उपयोग की शर्तें

प्रभावी दिनांक: 10 जनवरी, 2025

RateSnap में आपका स्वागत है! हमारे मोबाइल एप्लिकेशन ("एप्लिकेशन") को डाउनलोड, इंस्टॉल या उपयोग करके, आप इन उपयोग की शर्तों ("शर्तें") से बाध्य होने पर सहमत होते हैं। यदि आप इन शर्तों से सहमत नहीं हैं, तो कृपया एप्लिकेशन का उपयोग न करें।

1. सेवा विवरण
RateSnap व्यक्तिगत और सूचनात्मक उपयोग के लिए वास्तविक समय मुद्रा रूपांतरण उपकरण और विनिमय दर जानकारी प्रदान करता है। हमारी सेवाएं शामिल हैं:
• विभिन्न मुद्राओं के बीच वास्तविक समय मुद्रा रूपांतरण
• ऐतिहासिक विनिमय दर डेटा
• दर अलर्ट और अधिसूचनाएं
• ऑफलाइन मुद्रा रूपांतरण क्षमताएं

2. शर्तों की स्वीकृति
RateSnap तक पहुंचकर और इसका उपयोग करके, आप इस समझौते की शर्तों और प्रावधानों से बाध्य होने पर सहमत होते हैं। ये शर्तें एप्लिकेशन के सभी उपयोगकर्ताओं पर लागू होती हैं।

3. उपयोग लाइसेंस
इन शर्तों के आपके अनुपालन के अधीन, हम आपको एक सीमित, गैर-अनन्य, गैर-हस्तांतरणीय, गैर-उपलाइसेंस योग्य लाइसेंस प्रदान करते हैं:
• अपने मोबाइल डिवाइस पर एप्लिकेशन डाउनलोड और इंस्टॉल करने के लिए
• व्यक्तिगत, गैर-व्यावसायिक उद्देश्यों के लिए एप्लिकेशन तक पहुंच और उपयोग करने के लिए
• मुद्रा रूपांतरण सुविधाओं और विनिमय दर डेटा तक पहुंच के लिए

4. उपयोगकर्ता की जिम्मेदारियां
आप सहमत हैं:
• एप्लिकेशन का उपयोग केवल वैध उद्देश्यों के लिए करें
• पूर्व लिखित सहमति के बिना किसी भी व्यावसायिक गतिविधि के लिए एप्लिकेशन का उपयोग न करें
• एप्लिकेशन के रिवर्स इंजीनियरिंग, संशोधन या व्युत्पन्न कार्य बनाने का प्रयास न करें
• एप्लिकेशन के उचित कार्य में हस्तक्षेप न करें
• आवश्यक होने पर सटीक जानकारी प्रदान करें

5. सटीकता अस्वीकरण
विनिमय दरें और रूपांतरण गणना केवल सूचनात्मक उद्देश्यों के लिए प्रदान की जाती हैं। हालांकि हम सटीकता के लिए प्रयास करते हैं, हम गारंटी नहीं देते कि:
• विनिमय दरें वास्तविक समय या सटीक हैं
• रूपांतरण गणना त्रुटि मुक्त हैं
• एप्लिकेशन हमेशा उपलब्ध होगा
• मुद्रा डेटा अद्यतित है

6. देयता की सीमा
लागू कानून द्वारा अनुमत अधिकतम सीमा तक, RateSnap और इसके डेवलपर्स उत्तरदायी नहीं होंगे:
• किसी भी प्रत्यक्ष, अप्रत्यक्ष, आकस्मिक या परिणामी हानियों के लिए
• लाभ, डेटा या व्यावसायिक अवसरों के नुकसान के लिए
• विनिमय दर जानकारी में अशुद्धियों के लिए
• सेवा व्यवधान या अनुपलब्धता के लिए

7. डेटा गोपनीयता
आपकी गोपनीयता हमारे लिए महत्वपूर्ण है। कृपया हमारी गोपनीयता नीति की समीक्षा करें, जो आपके एप्लिकेशन के उपयोग को भी नियंत्रित करती है, ताकि हमारी प्रथाओं को समझा जा सके।

8. शर्तों में संशोधन
हम किसी भी समय इन शर्तों को संशोधित करने का अधिकार सुरक्षित रखते हैं। हम एप्लिकेशन या ईमेल के माध्यम से महत्वपूर्ण परिवर्तनों के बारे में उपयोगकर्ताओं को सूचित करेंगे। परिवर्तनों के बाद एप्लिकेशन का निरंतर उपयोग नए शर्तों की स्वीकृति का गठन करता है।

9. समाप्ति
हम किसी भी कारण से, पूर्व सूचना के बिना, तुरंत आपके एप्लिकेशन तक पहुंच को समाप्त या निलंबित कर सकते हैं। समाप्ति के बाद, आपके एप्लिकेशन का उपयोग करने का अधिकार तुरंत समाप्त हो जाएगा।

10. लागू कानून
ये शर्तें कानूनों के संघर्ष के प्रावधानों की परवाह किए बिना, लागू स्थानीय कानूनों द्वारा शासित और समझी जाएंगी।

11. संपर्क जानकारी
यदि आपके पास इन शर्तों के बारे में कोई प्रश्न हैं, तो कृपया support@ratesnap.app पर हमसे संपर्क करें।

RateSnap चुनने के लिए धन्यवाद!`
    };
    return terms[language as keyof typeof terms] || terms.en;
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    scrollView: {
      flex: 1,
      padding: 20,
    },
    header: {
      marginBottom: 24,
      paddingBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: textColor,
      marginBottom: 8,
      paddingVertical: 5,
    },
    subtitle: {
      fontSize: 16,
      color: textSecondaryColor,
      opacity: 0.8,
    },
    section: {
      backgroundColor: surfaceColor,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: textColor,
      marginBottom: 16,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginVertical: 4,
      borderRadius: 8,
    },
    settingItemText: {
      fontSize: 16,
      color: textColor,
      fontWeight: '500',
    },
    settingValue: {
      fontSize: 15,
      color: textSecondaryColor,
    },
    button: {
      backgroundColor: primaryColor,
      borderRadius: 8,
      padding: 14,
      alignItems: 'center',
      marginVertical: 8,
    },
    buttonText: {
      color: textColor,
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: surfaceColor,
      borderWidth: 1,
      borderColor: textSecondaryColor + '30',
    },
    secondaryButtonText: {
      color: textSecondaryColor,
    },
    modalContainer: {
      backgroundColor: surfaceColor,
      borderRadius: 12,
      padding: 20,
      margin: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingRight: 2, // Add more padding to ensure close button stays within bounds
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: textColor,
    },
    closeButton: {
      width: 32,
      height: 32,
      backgroundColor: '#f3f4f6',
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonText: {
      fontSize: 18,
      color: '#6b7280',
      fontWeight: 'bold',
    },
    form: {
      gap: 16,
    },
    inputGroup: {
      gap: 8,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: textColor,
    },
    input: {
      borderWidth: 1,
      borderColor: textSecondaryColor + '30',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: textColor,
      backgroundColor: backgroundColor,
    },
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    toggleButton: {
      width: 50,
      height: 28,
      borderRadius: 14,
      padding: 2,
      justifyContent: 'center',
    },
    toggleIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: textSecondaryColor,
    },
    languageOption: {
      padding: 16,
      marginVertical: 4,
      borderRadius: 8,
      backgroundColor: backgroundColor,
    },
    checkmark: {
      fontSize: 18,
      color: primaryColor,
      fontWeight: 'bold',
    },
  }), [backgroundColor, surfaceColor, primaryColor, textColor, textSecondaryColor]);

  // Render theme selection modal
  const renderThemeSelection = () => {
    if (!showThemeSelection) return null;

    return (
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <ThemedText style={styles.modalTitle}>{t('settings.theme')}</ThemedText>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowThemeSelection(false)}
          >
            <ThemedText style={styles.closeButtonText}>×</ThemedText>
          </TouchableOpacity>
        </View>

        {[
          { key: 'system', name: t('settings.system'), icon: '📱' },
          { key: 'light', name: t('settings.light'), icon: '☀️' },
          { key: 'dark', name: t('settings.dark'), icon: '🌙' },
        ].map((theme) => (
          <TouchableOpacity
            key={theme.key}
            style={[
              styles.languageOption,
              themePreference === theme.key && { backgroundColor: primaryColor + '20' }
            ]}
            onPress={() => {
              setThemePreference(theme.key as any);
              setShowThemeSelection(false);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <ThemedText style={{ fontSize: 20 }}>{theme.icon}</ThemedText>
              <ThemedText style={styles.settingItemText}>{theme.name}</ThemedText>
              {themePreference === theme.key && (
                <ThemedText style={styles.checkmark}>✓</ThemedText>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };


  // Render notification settings modal
  const renderNotificationSettings = () => {
    if (!showNotificationSettings) return null;

    return (
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <ThemedText style={styles.modalTitle}>{t('settings.notifications')}</ThemedText>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowNotificationSettings(false)}
          >
            <ThemedText style={styles.closeButtonText}>×</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={{ gap: 16 }}>
          {[
            { key: 'enabled', label: t('settings.enableNotifications'), icon: notificationSettings.enabled ? '🔔' : '🔕' },
            { key: 'sound', label: t('settings.sound'), icon: '🔊' },
            { key: 'vibration', label: t('settings.vibration'), icon: '📳' },
            { key: 'showPreview', label: t('settings.showPreview'), icon: '👁️' },
          ].map((setting) => (
            <View key={setting.key} style={styles.toggleContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <ThemedText style={{ fontSize: 20 }}>{setting.icon}</ThemedText>
                <ThemedText style={styles.settingItemText}>{setting.label}</ThemedText>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  notificationSettings[setting.key as keyof typeof notificationSettings]
                    ? { backgroundColor: primaryColor }
                    : { backgroundColor: textSecondaryColor + '30' }
                ]}
                onPress={() => handleNotificationToggle(setting.key as keyof typeof notificationSettings)}
                disabled={setting.key !== 'enabled' && !notificationSettings.enabled}
              >
                <View
                  style={[
                    styles.toggleIndicator,
                    notificationSettings[setting.key as keyof typeof notificationSettings] && {
                      backgroundColor: textColor,
                      marginLeft: 22
                    }
                  ]}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render terms of use modal
  const renderTerms = () => {
    if (!showTerms) return null;

    return (
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <ThemedText style={styles.modalTitle}>{t('settings.termsOfUse')}</ThemedText>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowTerms(false)}
          >
            <ThemedText style={styles.closeButtonText}>×</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ maxHeight: 300 }}>
          <ThemedText style={{ fontSize: 14, lineHeight: 20, color: textColor }}>
            {getCurrentTerms()}
          </ThemedText>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>⚙️ {t('settings.title')}</ThemedText>
          <ThemedText style={styles.subtitle}>
            {t('settings.subtitle')}
          </ThemedText>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('settings.preferences')}</ThemedText>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowThemeSelection(true)}
          >
            <ThemedText style={styles.settingItemText}>🎨 {t('settings.theme')}</ThemedText>
            <ThemedText style={styles.settingValue}>
              {themePreference === 'system' ? t('settings.system') :
               themePreference === 'light' ? t('settings.light') : t('settings.dark')}
            </ThemedText>
          </TouchableOpacity>


          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowNotificationSettings(true)}
          >
            <ThemedText style={styles.settingItemText}>🔔 {t('settings.notifications')}</ThemedText>
            <ThemedText style={styles.settingValue}>
              {notificationSettings.enabled ? t('common.enabled') : t('common.disabled')}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('settings.dataManagement')}</ThemedText>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleClearCache}
          >
            <ThemedText style={[styles.buttonText, styles.secondaryButtonText]}>
              🗑️ {t('settings.clearCache')}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleExportData}
          >
            <ThemedText style={[styles.buttonText, styles.secondaryButtonText]}>
              📊 {t('settings.exportData')}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        {user && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{t('settings.accountInfo')}</ThemedText>

            <TouchableOpacity style={styles.settingItem}>
              <ThemedText style={styles.settingItemText}>👤 {t('auth.username')}</ThemedText>
              <ThemedText style={styles.settingValue}>
                {user.user_metadata?.username || user.email?.split('@')[0]}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <ThemedText style={styles.settingItemText}>📧 {t('auth.email')}</ThemedText>
              <ThemedText style={styles.settingValue}>{user.email}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleSignOut}
            >
              <ThemedText style={[styles.buttonText, styles.secondaryButtonText]}>
                🚪 {t('auth.signout')}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Exchange Rate Info Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>📈{t('settings.exchangeRateInfo')}</ThemedText>
          <ThemedText style={[styles.settingValue, { fontSize: 14, marginBottom: 16, lineHeight: 20 }]}>
            {t('settings.exchangeRateInfoDescription')}
          </ThemedText>

          <View style={[styles.settingItem, { marginBottom: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ThemedText style={{ fontSize: 16 }}>🕒</ThemedText>
              <ThemedText style={styles.settingItemText}>{t('time.lastUpdate')}</ThemedText>
            </View>
            <View style={{ alignItems: 'flex-end', flex: 1 }}>
              <ThemedText style={[styles.settingValue, { textAlign: 'right', fontSize: 14, lineHeight: 18 }]}>
                {exchangeRateData?.time_last_update_utc
                  ? new Date(exchangeRateData.time_last_update_utc).toLocaleString()
                  : 'Loading...'}
              </ThemedText>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ThemedText style={{ fontSize: 16 }}>⏰</ThemedText>
              <ThemedText style={styles.settingItemText}>{t('time.nextUpdate')}</ThemedText>
            </View>
            <View style={{ alignItems: 'flex-end', flex: 1 }}>
              <ThemedText style={[styles.settingValue, { textAlign: 'right', fontSize: 14, lineHeight: 18 }]}>
                {exchangeRateData?.time_next_update_utc
                  ? new Date(exchangeRateData.time_next_update_utc).toLocaleString()
                  : 'Loading...'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('settings.aboutSupport')}</ThemedText>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowTerms(true)}
          >
            <ThemedText style={styles.settingItemText}>📄 {t('settings.termsOfUse')}</ThemedText>
            <ThemedText style={styles.settingValue}>›</ThemedText>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('settings.about')}</ThemedText>

          <TouchableOpacity style={styles.settingItem}>
            <ThemedText style={styles.settingItemText}>ℹ️ {t('settings.about')}</ThemedText>
            <ThemedText style={styles.settingValue}>1.0.0</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowContactSupport(true)}
          >
            <ThemedText style={styles.settingItemText}>📧 {t('settings.contactSupport')}</ThemedText>
            <ThemedText style={styles.settingValue}>Send Message</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      {renderThemeSelection()}
      {renderNotificationSettings()}
      {renderTerms()}
      <ContactSupportModal
        visible={showContactSupport}
        onClose={() => setShowContactSupport(false)}
      />
    </SafeAreaView>
  );
}
