import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSupabaseClient } from '@/lib/supabase-safe';

export default function SettingsScreen() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  
  // Account info form state
  const [accountInfo, setAccountInfo] = useState({
    username: user?.user_metadata?.username || user?.email?.split('@')[0] || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Multi-language terms of use data
  const termsOfUse = {
    en: `Terms of Use for RateSnap

Effective Date: 10.01.2025

Welcome to RateSnap, a currency converter application designed to provide real-time exchange rate information for personal and non-commercial use. By using RateSnap, you agree to the following Terms of Use. Please read them carefully.

1. Acceptance of Terms
By accessing or using RateSnap, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use. If you do not agree, please do not use the application.

2. Description of Service
RateSnap provides currency conversion tools and exchange rate information sourced from third-party providers. While we strive for accuracy, exchange rates may vary, and we do not guarantee the accuracy, timeliness, or completeness of the information provided.

3. Personal Use Only
RateSnap is intended for personal, non-commercial use. You agree not to use the app for any unauthorized or illegal purposes, including but not limited to:
- Automated data scraping.
- Commercial trading or currency arbitrage.
- Misrepresentation of exchange rates in financial transactions.

4. Intellectual Property
All content, features, and functionality of RateSnap, including but not limited to the app's design, text, graphics, and logos, are owned by RateSnap or its licensors and are protected by applicable copyright, trademark, and other intellectual property laws.

5. Limitation of Liability
RateSnap is provided "as is" without warranties of any kind. To the fullest extent permitted by law:
- RateSnap disclaims all warranties, express or implied, including but not limited to warranties of merchantability and fitness for a particular purpose.
- RateSnap shall not be held liable for any direct, indirect, incidental, or consequential damages arising from your use of the app.

6. Third-Party Services
RateSnap may include links to third-party websites or services. We are not responsible for the content, accuracy, or practices of these third parties. Your interactions with third-party services are governed by their respective terms and policies.

7. Changes to the Terms
We reserve the right to update or modify these Terms of Use at any time without prior notice. Continued use of RateSnap after changes are made constitutes acceptance of the revised Terms of Use. It is your responsibility to review these terms periodically.

8. Privacy Policy
Your use of RateSnap is also governed by our Privacy Policy, which explains how we collect, use, and protect your data. By using the app, you agree to the terms of our Privacy Policy.

9. Termination
We reserve the right to terminate or suspend your access to RateSnap at our discretion, without notice, for conduct that we believe violates these Terms of Use or is harmful to other users, us, or third parties.

Thank you for choosing RateSnap!`,
    es: `Términos de Uso para RateSnap

Fecha de Vigencia: 10.01.2025

Bienvenido a RateSnap, una aplicación de conversión de divisas diseñada para proporcionar información de tipos de cambio en tiempo real para uso personal y no comercial. Al usar RateSnap, aceptas los siguientes Términos de Uso. Por favor, léelos cuidadosamente.

1. Aceptación de Términos
Al acceder o usar RateSnap, reconoces que has leído, entendido y aceptas estar sujeto a estos Términos de Uso. Si no estás de acuerdo, por favor no uses la aplicación.

2. Descripción del Servicio
RateSnap proporciona herramientas de conversión de divisas e información de tipos de cambio obtenida de proveedores externos. Aunque nos esforzamos por la precisión, los tipos de cambio pueden variar, y no garantizamos la precisión, puntualidad o integridad de la información proporcionada.

3. Solo Uso Personal
RateSnap está destinado para uso personal, no comercial. Aceptas no usar la aplicación para ningún propósito no autorizado o ilegal, incluyendo pero no limitado a:
- Extracción automatizada de datos.
- Comercio o arbitraje de divisas.
- Falsificación de tipos de cambio en transacciones financieras.

4. Propiedad Intelectual
Todo el contenido, características y funcionalidad de RateSnap, incluyendo pero no limitado al diseño de la aplicación, texto, gráficos y logotipos, son propiedad de RateSnap o sus licenciantes y están protegidos por las leyes aplicables de derechos de autor, marcas comerciales y otras leyes de propiedad intelectual.

5. Limitación de Responsabilidad
RateSnap se proporciona "tal como está" sin garantías de ningún tipo. En la medida máxima permitida por la ley:
- RateSnap declina todas las garantías, expresas o implícitas, incluyendo pero no limitado a garantías de comercialización e idoneidad para un propósito particular.
- RateSnap no será responsable de ningún daño directo, indirecto, incidental o consecuente que surja del uso de la aplicación.

6. Servicios de Terceros
RateSnap puede incluir enlaces a sitios web o servicios de terceros. No somos responsables del contenido, precisión o prácticas de estos terceros. Tus interacciones con servicios de terceros se rigen por sus respectivos términos y políticas.

7. Cambios a los Términos
Nos reservamos el derecho de actualizar o modificar estos Términos de Uso en cualquier momento sin previo aviso. El uso continuo de RateSnap después de que se realicen los cambios constituye la aceptación de los Términos de Uso revisados. Es tu responsabilidad revisar estos términos periódicamente.

8. Política de Privacidad
Tu uso de RateSnap también se rige por nuestra Política de Privacidad, que explica cómo recopilamos, usamos y protegemos tus datos. Al usar la aplicación, aceptas los términos de nuestra Política de Privacidad.

9. Terminación
Nos reservamos el derecho de terminar o suspender tu acceso a RateSnap a nuestra discreción, sin previo aviso, por conducta que creemos que viola estos Términos de Uso o es perjudicial para otros usuarios, nosotros o terceros.

¡Gracias por elegir RateSnap!`,
    ru: `Условия использования RateSnap

Дата вступления в силу: 10.01.2025

Добро пожаловать в RateSnap, приложение для конвертации валют, предназначенное для предоставления информации о курсах обмена в режиме реального времени для личного и некоммерческого использования. Используя RateSnap, вы соглашаетесь со следующими Условиями использования. Пожалуйста, прочтите их внимательно.

1. Принятие условий
Получая доступ или используя RateSnap, вы подтверждаете, что прочитали, поняли и соглашаетесь соблюдать настоящие Условия использования. Если вы не согласны, пожалуйста, не используйте приложение.

2. Описание услуг
RateSnap предоставляет инструменты конвертации валют и информацию о курсах обмена от внешних поставщиков. Хотя мы стремимся к точности, курсы валют могут варьироваться, и мы не гарантируем точность, своевременность или полноту предоставляемой информации.

3. Только личное использование
RateSnap предназначен для личного, некоммерческого использования. Вы соглашаетесь не использовать приложение для любых несанкционированных или незаконных целей, включая, но не ограничиваясь:
- Автоматизированный скрапинг данных.
- Торговлю или арбитраж валют.
- Искажение курсов обмена в финансовых операциях.

4. Интеллектуальная собственность
Весь контент, функции и функциональность RateSnap, включая, но не ограничиваясь дизайном приложения, текстом, графикой и логотипами, принадлежат RateSnap или ее лицензиарам и защищены применимыми законами об авторских правах, товарных знаках и других законах об интеллектуальной собственности.

5. Ограничение ответственности
RateSnap предоставляется "как есть" без каких-либо гарантий. В максимальной степени, разрешенной законом:
- RateSnap отклоняет все гарантии, явные или подразумеваемые, включая, но не ограничиваясь гарантиями товарной пригодности и пригодности для конкретной цели.
- RateSnap не несет ответственности за любые прямые, косвенные, случайные или косвенные убытки, возникающие в результате использования приложения.

6. Сторонние услуги
RateSnap может включать ссылки на веб-сайты или услуги третьих сторон. Мы не несем ответственности за контент, точность или практики этих третьих сторон. Ваши взаимодействия со сторонними услугами регулируются их соответствующими условиями и политиками.

7. Изменения условий
Мы оставляем за собой право обновлять или изменять настоящие Условия использования в любое время без предварительного уведомления. Продолжение использования RateSnap после внесения изменений означает принятие пересмотренных Условий использования. Ваша ответственность периодически просматривать эти условия.

8. Политика конфиденциальности
Использование RateSnap также регулируется нашей Политикой конфиденциальности, которая объясняет, как мы собираем, используем и защищаем ваши данные. Используя приложение, вы соглашаетесь с условиями нашей Политики конфиденциальности.

9. Прекращение действия
Мы оставляем за собой право прекратить или приостановить ваш доступ к RateSnap по нашему усмотрению без предварительного уведомления за поведение, которое, по нашему мнению, нарушает настоящие Условия использования или наносит вред другим пользователям, нам или третьим лицам.

Спасибо, что выбрали RateSnap!`,
    zh: `RateSnap 使用条款

生效日期: 2025年1月10日

欢迎使用RateSnap，这是一个货币转换应用程序，旨在为个人和非商业用途提供实时汇率信息。使用RateSnap即表示您同意以下使用条款。请仔细阅读。

1. 条款接受
访问或使用RateSnap，即表示您已阅读、理解并同意受这些使用条款约束。如果您不同意，请不要使用应用程序。

2. 服务描述
RateSnap提供货币转换工具和来自第三方提供商的汇率信息。虽然我们努力确保准确性，但汇率可能会有变动，我们不保证所提供信息的准确性、及时性或完整性。

3. 仅限个人使用
RateSnap仅供个人、非商业使用。您同意不得将应用程序用于任何未经授权或非法目的，包括但不限于：
- 自动化数据抓取。
- 商业交易或货币套利。
- 在金融交易中歪曲汇率。

4. 知识产权
RateSnap的所有内容、功能和特性，包括但不限于应用程序的设计、文本、图形和标志，均为RateSnap或其许可方所有，并受适用的版权、商标和其他知识产权法保护。

5. 责任限制
RateSnap按"现状"提供，不提供任何形式的保证。在法律允许的最大范围内：
- RateSnap否认所有明示或暗示的保证，包括但不限于适销性和特定用途适用性的保证。
- RateSnap不对因使用应用程序而产生的任何直接、间接、偶然或后果性损害承担责任。

6. 第三方服务
RateSnap可能包含指向第三方网站或服务的链接。我们不对这些第三方内容、准确性或做法负责。您与第三方服务的交互受其各自的条款和政策约束。

7. 条款变更
我们保留随时更新或修改这些使用条款的权利，恕不另行通知。在做出更改后继续使用RateSnap即表示接受修订后的使用条款。您有责任定期查看这些条款。

8. 隐私政策
您对RateSnap的使用也受我们的隐私政策约束，该政策解释了我们如何收集、使用和保护您的数据。使用应用程序即表示您同意我们的隐私政策条款。

9. 终止
我们保留在我们认为适当的情况下终止或暂停您对RateSnap的访问的权利，恕不另行通知，用于我们认为违反这些使用条款或对其他用户、我们或第三方有害的行为。

感谢选择RateSnap！`,
    hi: `RateSnap के उपयोग की शर्तें

प्रभावी तिथि: 10.01.2025

RateSnap में आपका स्वागत है, जो व्यक्तिगत और गैर-व्यावसायिक उपयोग के लिए रियल-टाइम विनिमय दर जानकारी प्रदान करने के लिए डिज़ाइन किया गया एक मुद्रा कनवर्टर एप्लिकेशन है। RateSnap का उपयोग करके, आप निम्नलिखित उपयोग की शर्तों से सहमत होते हैं। कृपया इन्हें ध्यान से पढ़ें।

1. शर्तों की स्वीकृति
RateSnap का उपयोग करने तक पहुंचकर या उपयोग करके, आप स्वीकार करते हैं कि आपने इन उपयोग की शर्तों को पढ़ा, समझा है, और इनसे बंधने के लिए सहमत हैं। यदि आप सहमत नहीं हैं, तो कृपया एप्लिकेशन का उपयोग न करें।

2. सेवा का विवरण
RateSnap मुद्रा रूपांतरण उपकरण और तृतीय पक्ष प्रदाताओं से सोर्स की गई विनिमय दर जानकारी प्रदान करता है। हालांकि हम सटीकता के लिए प्रयास करते हैं, विनिमय दरें भिन्न हो सकती हैं, और हम प्रदान की गई जानकारी की सटीकता, समयबद्धता या पूर्णता की गारंटी नहीं देते हैं।

3. केवल व्यक्तिगत उपयोग
RateSnap व्यक्तिगत, गैर-व्यावसायिक उपयोग के लिए अभिप्रेत है। आप सहमत हैं कि आप ऐप को किसी भी अनधिकृत या अवैध उद्देश्य के लिए उपयोग नहीं करेंगे, जिसमें लेकिन सीमित नहीं है:
- स्वचालित डेटा स्क्रैपिंग।
- वाणिज्यिक ट्रेडिंग या मुद्रा आर्बिट्रेज।
- वित्तीय लेनदेन में विनिमय दरों का गलत प्रतिनिधित्व।

4. बौद्धिक संपदा
RateSnap की सभी सामग्री, विशेषताएं और कार्यक्षमता, लेकिन एप्लिकेशन के डिज़ाइन, टेक्स्ट, ग्राफिक्स और लोगो तक सीमित नहीं, RateSnap या इसके लाइसेंसधारकों के स्वामित्व में हैं और लागू कॉपीराइट, ट्रेडमार्क और अन्य बौद्धिक संपदा कानूनों द्वारा संरक्षित हैं।

5. देयता की सीमा
RateSnap किसी भी प्रकार की वारंटी के बिना "जैसा है" के रूप में प्रदान किया जाता है। कानून द्वारा अनुमत अधिकतम सीमा तक:
- RateSnap सभी वारंटियों, स्पष्ट या निहित, लेकिन वाणिज्यिकता और किसी विशिष्ट उद्देश्य के लिए फिटनेस की वारंटियों तक सीमित नहीं, से इनकार करता है।
- RateSnap एप्लिकेशन के उपयोग से उत्पन्न होने वाले किसी भी प्रत्यक्ष, अप्रत्यक्ष, आकस्मिक या परिणामी नुकसान के लिए उत्तरदायी नहीं होगा।

6. तृतीय पक्ष सेवाएं
RateSnap में तृतीय पक्ष वेबसाइटों या सेवाओं के लिंक शामिल हो सकते हैं। हम इन तृतीय पक्षों की सामग्री, सटीकता या प्रथाओं के लिए जिम्मेदार नहीं हैं। तृतीय पक्ष सेवाओं के साथ आपकी बातचीत उनकी संबंधित शर्तों और नीतियों द्वारा शासित है।

7. शर्तों में परिवर्तन
हम बिना पूर्व सूचना के किसी भी समय इन उपयोग की शर्तों को अपडेट या संशोधित करने का अधिकार सुरक्षित रखते हैं। परिवर्तन के बाद RateSnap का निरंतर उपयोग संशोधित उपयोग की शर्तों की स्वीकृति गठित करता है। इन शर्तों की समय-समय पर समीक्षा करना आपकी जिम्मेदारी है।

8. गोपनीयता नीति
RateSnap का उपयोग हमारी गोपनीयता नीति द्वारा भी शासित है, जो बताती है कि हम आपके डेटा को कैसे एकत्र, उपयोग और सुरक्षित करते हैं। एप्लिकेशन का उपयोग करके, आप हमारी गोपनीयता नीति की शर्तों से सहमत होते हैं।

9. समापन
हम अपने विवेक के अनुसार, किसी भी सूचना के बिना, उस आचरण के लिए आपकी RateSnap तक पहुंच को समाप्त या निलंबित करने का अधिकार सुरक्षित रखते हैं जिसे हम मानते हैं कि ये उपयोग की शर्तों का उल्लंघन करता है या अन्य उपयोगकर्ताओं, हमें या तृतीय पक्षों के लिए हानिकारक है।

RateSnap चुनने के लिए धन्यवाद!`,
    hy: `RateSnap-ի օգտագործման պայմանները

Ուժի մեջ մտնելու ամսաթիվ: 10.01.2025

Բարի գալուստ RateSnap, անհատական և ոչ առևտրական օգտագործման համար իրական ժամանակի փոխարժեքի տեղեկատվություն տրամադրելու համար նախագծված արժույթի փոխարկիչ հավելված։ RateSnap-ի օգտագործմամբ դուք համաձայնում եք հետևյալ Օգտագործման Պայմանների հետ: Խնդրում ենք ուշադիր կարդալ այն։

1. Պայմանների ընդունում
RateSnap-ին մուտք գործելով կամ օգտագործելով՝ դուք հաստատում եք, որ կարդացել, հասկացել և համաձայնում եք կապվել այս Օգտագործման Պայմանների հետ: Եթե համաձայն չեք, խնդրում ենք չօգտագործեք հավելվածը:

2. Ծառայության նկարագրություն
RateSnap-ը տրամադրում է արժույթի փոխարկման գործիքներ և փոխարժեքի տեղեկատվություն՝ երրորդ կողմի մատակարարների կողմից: Չնայած մենք ձգտում ենք ճշտության, փոխարժեքները կարող են տարբերվել, և մենք չենք երաշխավորում տրամադրված տեղեկատվության ճշտությունը, ժամանակին լինելը կամ լրիվ լինելը:

3. Միայն անհատական օգտագործում
RateSnap-ը նախատեսված է անհատական, ոչ առևտրական օգտագործման համար: Դուք համաձայնում եք չօգտագործել հավելվածը որևէ չթույլատրված կամ անօրինական նպատակով, ներառյալ, բայց չսահմանափակվելով:
- Ավտոմատացված տվյալների գրազ:
- Առևտրական առևտուր կամ արժույթի արբիտրաժ:
- Փոխարժեքների սխալ ներկայացում ֆինանսական գործառնություններում:

4. Բանկային սեփականություն
RateSnap-ի ամբողջ բովանդակությունը, հատկանիշները և գործառնականությունը, ներառյալ, բայց չսահմանափակվելով հավելվածի դիզայնը, տեքստը, գրաֆիկան և լոգոները, պատկանում են RateSnap-ին կամ նրա լիցենզավորողներին և պաշտպանված են գործող հեղինակային իրավունքի, ապրանքանիշի և այլ բանկային սեփականության օրենքներով:

5. Պատասխանատվության սահմանափակում
RateSnap-ը տրամադրվում է «ինչպես է» ցանկացած երաշխիքների բացակայությամբ: Օրենքով թույլատրված առավելագույն չափով:
- RateSnap-ը հրաժարվում է բոլոր երաշխիքներից, բացահայտ կամ ներառված, ներառյալ, բայց չսահմանափակվելով վաճառելիության և որոշակի նպատակի համար համապատասխանության երաշխիքներից:
- RateSnap-ը պատասխանատվություն չի կրի հավելվածի օգտագործումից առաջացած որևէ ուղղակի, անուղղակի, պատահական կամ հետևանքային վնասների համար:

6. Երրորդ կողմի ծառայություններ
RateSnap-ը կարող է ներառել հղումներ երրորդ կողմի կայքերի կամ ծառայությունների վրա: Մենք պատասխանատվություն չենք կրում այս երրորդ կողմերի բովանդակության, ճշտության կամ գործելակերպի համար: Երրորդ կողմի ծառայությունների հետ ձեր փոխազդեցությունը կարգավորվում է նրանց համապատասխան պայմաններով և քաղաքականություններով:

7. Պայմանների փոփոխություններ
Մենք պահպանում ենք այս Օգտագործման Պայմանները ցանկացած պահի թարմացնելու կամ փոփոխելու իրավունքը՝ առանց նախազգուշացման: Փոփոխություններից հետո RateSnap-ի շարունակական օգտագործումը համարվում է վերանայված Օգտագործման Պայմանների ընդունում: Ձեր պատասխանատվությունն է ժամանակ առ ժամանակ վերանայել այս պայմանները:

8. Գաղտնիության քաղաքականություն
RateSnap-ի օգտագործումը նաև կարգավորվում է մեր Գաղտնիության Քաղաքականությամբ, որը բացատրում է, թե ինչպես ենք մենք հավաքում, օգտագործում և պաշտպանում ձեր տվյալները: Հավելվածի օգտագործմամբ դուք համաձայնում եք մեր Գաղտնիության Քաղաքականության պայմանների հետ:

9. Դադարեցում
Մենք պահպանում ենք մեր հայեցակարգով ձեր RateSnap-ի մուտքը դադարեցնելու կամ կասեցնելու իրավունքը՝ առանց ծանուցման, այն պահի համար, երբ մենք հավատում ենք, որ վարքը խախտում է այս Օգտագործման Պայմանները կամ վնասակար է այլ օգտագործողների, մեզ կամ երրորդ կողմերի համար:

RateSnap-ն ընտրելու համար շնորհակալություն!`,
  };

  // Get current terms of use in the current language
  const getCurrentTerms = () => {
    const currentTerms = termsOfUse[language as keyof typeof termsOfUse];
    return currentTerms || termsOfUse.en; // Fallback to English
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert('Success', 'You have been signed out successfully.');
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleUpdateAccountInfo = async () => {
    if (!accountInfo.username.trim() || !accountInfo.email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase || !user) {
        throw new Error('Authentication service not available');
      }

      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        email: accountInfo.email,
        data: {
          username: accountInfo.username,
        }
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Account information updated successfully.');
        setShowAccountInfo(false);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update account information.');
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase || !user) {
        throw new Error('Authentication service not available');
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Password updated successfully.');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowPasswordForm(false);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase || !user) {
        throw new Error('Authentication service not available');
      }

      // Delete user data from custom tables first
      await supabase.from('saved_rates').delete().eq('user_id', user.id);
      await supabase.from('rate_alerts').delete().eq('user_id', user.id);
      
      // Then delete the auth user
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Your account has been deleted successfully.');
        await signOut();
        router.replace('/');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete account.');
    }
  };

  const renderAccountInfoSection = () => {
    if (!user) {
      return (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            {t('settings.accountInfo')}
          </ThemedText>
          <ThemedText style={styles.sectionDescription}>
            {t('settings.loginRequired')}
          </ThemedText>
        </View>
      );
    }

    if (showAccountInfo) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>
              {t('settings.updateAccountInfo')}
            </ThemedText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                console.log('Cancel account info edit');
                setShowAccountInfo(false);
              }}
            >
              <ThemedText style={styles.closeButtonText}>×</ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>
                {t('auth.username')} *
              </ThemedText>
              <TextInput
                style={styles.input}
                value={accountInfo.username}
                onChangeText={(text: string) =>
                  setAccountInfo({ ...accountInfo, username: text })
                }
                placeholder={t('auth.username')}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>
                {t('auth.email')} *
              </ThemedText>
              <TextInput
                style={styles.input}
                value={accountInfo.email}
                onChangeText={(text: string) =>
                  setAccountInfo({ ...accountInfo, email: text })
                }
                placeholder={t('auth.email')}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  console.log('Cancel account info edit');
                  setShowAccountInfo(false);
                }}
              >
                <ThemedText style={styles.buttonSecondaryText}>
                  {t('common.cancel')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleUpdateAccountInfo}
              >
                <ThemedText style={styles.buttonPrimaryText}>
                  {t('common.save')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>
            {t('settings.accountInfo')}
          </ThemedText>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              console.log('Edit account info clicked');
              setShowAccountInfo(true);
            }}
          >
            <ThemedText style={styles.editButtonText}>
              {t('common.edit')}
            </ThemedText>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.infoCard}
          onPress={() => {
            console.log('Edit account info clicked');
            setShowAccountInfo(true);
          }}
        >
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>
              {t('auth.username')}:
            </ThemedText>
            <ThemedText style={styles.infoValue}>
              {user?.user_metadata?.username || user?.email?.split('@')[0]}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>
              {t('auth.email')}:
            </ThemedText>
            <ThemedText style={styles.infoValue}>
              {user?.email}
            </ThemedText>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPasswordSection = () => {
    if (!user) return null;

    if (showPasswordForm) {
      return (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            {t('settings.changePassword')}
          </ThemedText>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>
                {t('settings.newPassword')} *
              </ThemedText>
              <TextInput
                style={styles.input}
                value={passwordForm.newPassword}
                onChangeText={(text: string) =>
                  setPasswordForm({ ...passwordForm, newPassword: text })
                }
                placeholder={t('settings.newPassword')}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>
                {t('settings.confirmNewPassword')} *
              </ThemedText>
              <TextInput
                style={styles.input}
                value={passwordForm.confirmPassword}
                onChangeText={(text: string) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: text })
                }
                placeholder={t('settings.confirmNewPassword')}
                secureTextEntry
              />
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setShowPasswordForm(false)}
              >
                <ThemedText style={styles.buttonSecondaryText}>
                  {t('common.cancel')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleUpdatePassword}
              >
                <ThemedText style={styles.buttonPrimaryText}>
                  {t('common.update')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>
            {t('settings.password')}
          </ThemedText>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setShowPasswordForm(true)}
          >
            <ThemedText style={styles.editButtonText}>
              {t('common.change')}
            </ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.sectionDescription}>
          {t('settings.passwordUpdateDescription')}
        </ThemedText>
      </View>
    );
  };

  const renderTermsSection = () => {
    if (showTerms) {
      return (
        <View style={styles.termsFullView}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>
              {t('settings.termsOfUse')}
            </ThemedText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTerms(false)}
            >
              <ThemedText style={styles.closeButtonText}>×</ThemedText>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.termsScrollView}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <View style={styles.termsContainer}>
              <ThemedText style={styles.termsText}>
                {getCurrentTerms()}
              </ThemedText>
            </View>
          </ScrollView>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.section, styles.touchableSection]}
        onPress={() => setShowTerms(true)}
      >
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>
            {t('settings.termsOfUse')}
          </ThemedText>
          <ThemedText style={styles.arrowText}>›</ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f7f9' }}>
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>
              ⚙️ {t('settings.title')}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {t('settings.subtitle')}
            </ThemedText>
          </View>

          {/* Account Information Section */}
          {renderAccountInfoSection()}

          {/* Password Section */}
          {renderPasswordSection()}

          {/* Terms of Use Section */}
          {renderTermsSection()}

          {/* Additional Settings Sections */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>
                {t('settings.preferences')}
              </ThemedText>
            </View>
            
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/(tabs)/index?settings=theme')}
            >
              <ThemedText style={styles.settingItemText}>
                🎨 {t('settings.theme')}
              </ThemedText>
              <ThemedText style={styles.arrowText}>›</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/(tabs)/index?settings=language')}
            >
              <ThemedText style={styles.settingItemText}>
                🌍 {t('settings.language')}
              </ThemedText>
              <ThemedText style={styles.arrowText}>›</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/(tabs)/index?settings=notifications')}
            >
              <ThemedText style={styles.settingItemText}>
                🔔 {t('settings.notifications')}
              </ThemedText>
              <ThemedText style={styles.arrowText}>›</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Data Management Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {t('settings.dataManagement')}
            </ThemedText>
            
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => Alert.alert('Info', 'Cache cleared successfully')}
            >
              <ThemedText style={styles.settingItemText}>
                🗑️ {t('settings.clearCache')}
              </ThemedText>
              <ThemedText style={styles.arrowText}>›</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => Alert.alert('Info', 'Export feature coming soon')}
            >
              <ThemedText style={styles.settingItemText}>
                📊 {t('settings.exportData')}
              </ThemedText>
              <ThemedText style={styles.arrowText}>›</ThemedText>
            </TouchableOpacity>
          </View>

          {/* About & Support Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {t('settings.aboutSupport')}
            </ThemedText>
            
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/(tabs)/index?settings=about')}
            >
              <ThemedText style={styles.settingItemText}>
                ℹ️ {t('settings.about')}
              </ThemedText>
              <ThemedText style={styles.arrowText}>›</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => Alert.alert('Info', 'Email: support@ratesnap.app')}
            >
              <ThemedText style={styles.settingItemText}>
                📧 {t('settings.contactSupport')}
              </ThemedText>
              <ThemedText style={styles.arrowText}>›</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/(tabs)/index?settings=help')}
            >
              <ThemedText style={styles.settingItemText}>
                ❓ {t('settings.help')}
              </ThemedText>
              <ThemedText style={styles.arrowText}>›</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Sign Out Section */}
          {user && (
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.settingItem, styles.dangerItem]}
                onPress={handleSignOut}
              >
                <ThemedText style={styles.settingItemText}>
                  🚪 {t('auth.signout')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Delete Account Section */}
          {user && (
            <View style={[styles.section, styles.dangerSection]}>
              <ThemedText style={[styles.sectionTitle, styles.dangerTitle]}>
                {t('settings.dangerZone')}
              </ThemedText>
              <TouchableOpacity
                style={[styles.settingItem, styles.dangerItem]}
                onPress={handleDeleteAccount}
              >
                <ThemedText style={styles.dangerItemText}>
                  🗑️ {t('settings.deleteAccount')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom Spacer */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  touchableSection: {
    padding: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    color: '#1e293b',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#6366f1',
  },
  buttonPrimaryText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  buttonSecondaryText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: -20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.4)',
  },
  settingItemText: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  arrowText: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: '300',
  },
  closeButton: {
    padding: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  termsContent: {
    marginTop: 16,
    flexGrow: 1,
  },
  termsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  termsFullView: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    maxHeight: '70%',
  },
  termsScrollView: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  termsContainer: {
    paddingBottom: 20,
  },
  dangerSection: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(254, 242, 242, 0.1)',
  },
  dangerTitle: {
    color: '#dc2626',
  },
  dangerItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  dangerItemText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});