// Telegram Bot Webhook Handler
// Handles commands and messages from Telegram bot

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    date: number;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
        type: string;
      };
    };
    data?: string;
  };
}

interface TelegramMessage {
  chat_id: number;
  text: string;
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  reply_markup?: {
    inline_keyboard?: Array<Array<{ text: string; callback_data?: string; url?: string }>>;
    keyboard?: Array<Array<{ text: string }>>;
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
  };
}

async function sendTelegramMessage(message: TelegramMessage): Promise<void> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
}

async function handleStartCommand(chatId: number, userId: number, username?: string, firstName?: string): Promise<void> {
  // Register or update bot user
  await supabase
    .from("bot_users")
    .upsert({
      telegram_user_id: userId,
      telegram_username: username,
      telegram_first_name: firstName,
      is_subscribed: true,
      last_interaction_at: new Date().toISOString(),
    }, {
      onConflict: "telegram_user_id",
    });

  const welcomeMessage = `🚗 Добро пожаловать в RideConnect!

Я помогу вам найти попутчиков или стать водителем.

📱 <b>Что я умею:</b>
• Найти поездку
• Создать поездку
• Управлять бронированиями
• Получать уведомления
• Поддержка и помощь
• Оставить отзыв

🎁 <b>Сейчас все бесплатно!</b>
Подпишитесь на бота, чтобы получать:
• Уведомления о новых поездках
• Напоминания о бронированиях
• Специальные предложения

Используйте меню ниже для навигации:`;

  await sendTelegramMessage({
    chat_id: chatId,
    text: welcomeMessage,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🚀 Открыть приложение",
            url: `${Deno.env.get("APP_URL") || "https://your-app.vercel.app"}`,
          },
        ],
        [
          {
            text: "📊 Мои поездки",
            callback_data: "my_rides",
          },
          {
            text: "🔍 Найти поездку",
            callback_data: "search_rides",
          },
        ],
        [
          {
            text: "💬 Поддержка",
            callback_data: "support",
          },
          {
            text: "⭐ Отзывы",
            callback_data: "reviews",
          },
        ],
        [
          {
            text: "💎 Premium",
            callback_data: "premium",
          },
          {
            text: "⚙️ Настройки",
            callback_data: "settings",
          },
        ],
      ],
    },
  });
}

async function handleCallbackQuery(
  callbackQuery: TelegramUpdate["callback_query"],
  chatId: number
): Promise<void> {
  if (!callbackQuery?.data) return;

  const data = callbackQuery.data;
  const userId = callbackQuery.from.id;

  switch (data) {
    case "my_rides":
      await sendTelegramMessage({
        chat_id: chatId,
        text: "📊 Откройте приложение, чтобы посмотреть ваши поездки:\n\n" +
          `${Deno.env.get("APP_URL") || "https://your-app.vercel.app"}/my-rides`,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 Открыть приложение",
                web_app: { url: `${Deno.env.get("APP_URL") || "https://your-app.vercel.app"}/my-rides` },
              },
            ],
          ],
        },
      });
      break;

    case "search_rides":
      await sendTelegramMessage({
        chat_id: chatId,
        text: "🔍 Откройте приложение, чтобы найти поездку:\n\n" +
          `${Deno.env.get("APP_URL") || "https://your-app.vercel.app"}/search`,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 Открыть приложение",
                url: `${Deno.env.get("APP_URL") || "https://your-app.vercel.app"}/search`,
              },
            ],
          ],
        },
      });
      break;

    case "premium":
      await sendTelegramMessage({
        chat_id: chatId,
        text: "💎 <b>Premium подписка</b>\n\n" +
          "Сейчас все функции бесплатны! 🎉\n\n" +
          "В будущем Premium даст вам:\n" +
          "• Приоритет в поиске\n" +
          "• Расширенные уведомления\n" +
          "• Статистику поездок\n" +
          "• Без рекламы\n\n" +
          "Следите за обновлениями!",
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 Открыть приложение",
                url: `${Deno.env.get("APP_URL") || "https://your-app.vercel.app"}`,
              },
            ],
          ],
        },
      });
      break;

    default:
      await sendTelegramMessage({
        chat_id: chatId,
        text: "Неизвестная команда. Используйте /start для начала.",
      });
  }
}

serve(async (req) => {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return new Response(JSON.stringify({ error: "TELEGRAM_BOT_TOKEN not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const update: TelegramUpdate = await req.json();

      // Handle callback queries
      if (update.callback_query) {
        const chatId = update.callback_query.message?.chat.id || update.callback_query.from.id;
        await handleCallbackQuery(update.callback_query, chatId);

        // Answer callback query
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callback_query_id: update.callback_query.id,
          }),
        });

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle messages
      if (update.message) {
        const message = update.message;
        const chatId = message.chat.id;
        const userId = message.from.id;
        const text = message.text || "";

        // Update bot user
        await supabase
          .from("bot_users")
          .upsert({
            telegram_user_id: userId,
            telegram_username: message.from.username,
            telegram_first_name: message.from.first_name,
            telegram_last_name: message.from.last_name,
            is_bot: message.from.is_bot,
            language_code: message.from.language_code,
            is_premium: message.from.is_premium || false,
            is_subscribed: true,
            last_interaction_at: new Date().toISOString(),
          }, {
            onConflict: "telegram_user_id",
          });

        // Handle commands
        if (text.startsWith("/start")) {
          await handleStartCommand(chatId, userId, message.from.username, message.from.first_name);
        } else if (text.startsWith("/help")) {
          await sendTelegramMessage({
            chat_id: chatId,
            text: "📖 <b>Помощь</b>\n\n" +
              "<b>Команды:</b>\n" +
              "/start - Начать работу с ботом\n" +
              "/help - Показать эту справку\n" +
              "/subscribe - Подписаться на уведомления\n\n" +
              "<b>Что умеет бот:</b>\n" +
              "• Открыть приложение\n" +
              "• Найти поездку\n" +
              "• Показать ваши поездки\n" +
              "• Получить Premium\n\n" +
              "Используйте кнопки в меню для быстрого доступа!",
            parse_mode: "HTML",
          });
        } else if (text.startsWith("/subscribe")) {
          await sendTelegramMessage({
            chat_id: chatId,
            text: "✅ Вы подписаны на уведомления!\n\n" +
              "Вы будете получать:\n" +
              "• Уведомления о новых поездках\n" +
              "• Напоминания о бронированиях\n" +
              "• Важные обновления",
          });
        } else if (text.startsWith("/support")) {
          await handleCallbackQuery({ data: "support", from: message.from } as any, chatId);
        } else if (text.startsWith("/review")) {
          await handleCallbackQuery({ data: "reviews", from: message.from } as any, chatId);
        } else if (text.startsWith("/ticket")) {
          // Handle ticket creation from text
          const ticketText = text.replace("/ticket", "").trim();
          if (ticketText) {
            // Create ticket
            const ticketNumber = generateTicketNumber();
            await supabase
              .from("support_tickets")
              .insert({
                telegram_user_id: userId,
                telegram_username: message.from.username,
                ticket_number: ticketNumber,
                subject: "Тикет из бота",
                message: ticketText,
                category: "general",
              });

            await sendTelegramMessage({
              chat_id: chatId,
              text: `✅ Тикет создан!\n\n` +
                `Номер: ${ticketNumber}\n` +
                `Мы ответим в течение 24 часов.\n\n` +
                `Проверить статус: /tickets`,
            });
          } else {
            await handleCallbackQuery({ data: "create_ticket", from: message.from } as any, chatId);
          }
        } else {
          await sendTelegramMessage({
            chat_id: chatId,
            text: "Привет! 👋\n\n" +
              "Используйте /start для начала работы или откройте приложение через кнопку ниже.",
            reply_markup: {
              inline_keyboard: [
              [
                {
                  text: "🚀 Открыть приложение",
                  url: `${Deno.env.get("APP_URL") || "https://your-app.vercel.app"}`,
                },
              ],
              ],
            },
          });
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

