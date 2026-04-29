import { Box, Container, Typography, Stack, Divider, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link as RouterLink } from 'react-router-dom';

export function PrivacyPolicyPage() {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
          На главную
        </Button>

        <Typography variant="h4" component="h1" gutterBottom>
          Политика обработки персональных данных
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Действует с 22 апреля 2026 года
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={3}>
          <section>
            <Typography variant="h6" gutterBottom>
              1. Общие положения
            </Typography>
            <Typography variant="body1">
              Настоящая Политика разработана в соответствии с Федеральным законом от 27.07.2006 №
              152-ФЗ «О персональных данных» и определяет порядок обработки персональных данных
              пользователей сайта (далее — «Сервис»). Используя Сервис, пользователь подтверждает
              своё согласие с условиями настоящей Политики.
            </Typography>
          </section>

          <section>
            <Typography variant="h6" gutterBottom>
              2. Состав обрабатываемых данных
            </Typography>
            <Typography variant="body1" component="div">
              При использовании Сервиса обрабатываются следующие данные:
              <ul>
                <li>имя и адрес электронной почты;</li>
                <li>наименование и реквизиты организации (для бизнес-аккаунтов);</li>
                <li>история заказов и комментарии к ним;</li>
                <li>технические данные: IP-адрес, тип браузера, время доступа.</li>
              </ul>
            </Typography>
          </section>

          <section>
            <Typography variant="h6" gutterBottom>
              3. Цели обработки
            </Typography>
            <Typography variant="body1" component="div">
              Персональные данные обрабатываются с целью:
              <ul>
                <li>предоставления доступа к Сервису и оформления заказов;</li>
                <li>уведомлений о статусе заказов и наличии товаров;</li>
                <li>обеспечения безопасности учётной записи;</li>
                <li>исполнения требований законодательства РФ.</li>
              </ul>
            </Typography>
          </section>

          <section>
            <Typography variant="h6" gutterBottom>
              4. Хранение данных в браузере
            </Typography>
            <Typography variant="body1">
              Сервис не использует cookies. Для работы используется локальное хранилище браузера
              (localStorage), в котором сохраняются: токены авторизации, содержимое корзины,
              настройки темы и подтверждения согласий. Эти данные не передаются на сторонние серверы
              и могут быть удалены пользователем самостоятельно через настройки браузера.
            </Typography>
          </section>

          <section>
            <Typography variant="h6" gutterBottom>
              5. Правовые основания
            </Typography>
            <Typography variant="body1">
              Обработка осуществляется на основании согласия субъекта персональных данных, а также
              для исполнения договора, стороной которого является субъект.
            </Typography>
          </section>

          <section>
            <Typography variant="h6" gutterBottom>
              6. Передача третьим лицам
            </Typography>
            <Typography variant="body1">
              Персональные данные не передаются третьим лицам, за исключением случаев,
              предусмотренных законодательством РФ, а также сервисов, обеспечивающих работу Сервиса
              (хостинг, отправка email-уведомлений) на условиях конфиденциальности.
            </Typography>
          </section>

          <section>
            <Typography variant="h6" gutterBottom>
              7. Сроки хранения
            </Typography>
            <Typography variant="body1">
              Данные хранятся в течение срока действия учётной записи и в течение срока,
              предусмотренного законодательством для хранения первичных бухгалтерских документов.
              Подтверждение совершеннолетия хранится в браузере в течение 30 дней, после чего
              запрашивается повторно.
            </Typography>
          </section>

          <section>
            <Typography variant="h6" gutterBottom>
              8. Права субъекта персональных данных
            </Typography>
            <Typography variant="body1">
              Пользователь вправе запросить информацию об обрабатываемых данных, потребовать их
              уточнения, блокирования или уничтожения, а также отозвать согласие на обработку,
              направив запрос на контактный email оператора.
            </Typography>
          </section>

          <section>
            <Typography variant="h6" gutterBottom>
              9. Контакты оператора
            </Typography>
            <Typography variant="body1">
              По вопросам обработки персональных данных вы можете связаться с оператором по
              электронной почте, указанной в разделе контактов Сервиса.
            </Typography>
          </section>
        </Stack>
      </Container>
    </Box>
  );
}
