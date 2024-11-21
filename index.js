const express = require("express");
const { Telegraf } = require("telegraf");
const moment = require("moment");
const axios = require("axios"); // Importar Axios para interactuar con Mastodon
require("dotenv").config();
const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

console.log("BOT Token:", process.env.BOT_TOKEN);
console.log("Mastodon Access Token:", process.env.MASTODON_ACCESS_TOKEN);
console.log("Webhook URL:", process.env.WEBHOOK_URL);

// URL de la API de Mastodon
const mastodonApiUrl = "https://todon.nl/api/v1"; // Cambia esta URL a la instancia de Mastodon que uses
const accessToken = process.env.MASTODON_ACCESS_TOKEN; // El token de acceso de Mastodon, usa un token personal

// Función para obtener el perfil de la cuenta
async function getProfile() {
  try {
    const response = await axios.get(`${mastodonApiUrl}/accounts/verify_credentials`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.data) {
      throw new Error("No data received from Mastodon API.");
    }
    return response.data;
  } catch (error) {
    console.error("Error al obtener el perfil:", error.message);
    return "No se pudo obtener el perfil. Por favor, intenta de nuevo más tarde.";
  }
}

// Función para obtener los últimos "toots"
async function getTimeline() {
  try {
    const response = await axios.get(`${mastodonApiUrl}/timelines/home`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.data) {
      throw new Error("No data received from Mastodon API.");
    }
    return response.data.map((toot) => `${toot.account.display_name}: ${toot.content}`).join("\n\n") || "No hay toots recientes.";
  } catch (error) {
    console.error("Error al obtener los toots:", error.message);
    return "No se pudieron obtener los últimos toots. Por favor, intenta de nuevo más tarde.";
  }
}

// Función para obtener las notificaciones
async function getNotifications() {
  try {
    const response = await axios.get(`${mastodonApiUrl}/notifications`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.data) {
      throw new Error("No data received from Mastodon API.");
    }
    return response.data.map((notification) => `${notification.type}: ${notification.status.account.display_name}`).join("\n\n") || "No tienes notificaciones.";
  } catch (error) {
    console.error("Error al obtener las notificaciones:", error.message);
    return "No se pudieron obtener las notificaciones. Por favor, intenta de nuevo más tarde.";
  }
}

// Función para obtener las cuentas que sigues
async function getFollowing() {
  try {
    const response = await axios.get(`${mastodonApiUrl}/accounts/relationships`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.data) {
      throw new Error("No data received from Mastodon API.");
    }
    return response.data.map((account) => (account.following ? account.account.display_name : "No sigues a nadie")).join("\n\n") || "No sigues a ninguna cuenta.";
  } catch (error) {
    console.error("Error al obtener las cuentas que sigues:", error.message);
    return "No se pudieron obtener las cuentas que sigues. Por favor, intenta de nuevo más tarde.";
  }
}

// Función para realizar una búsqueda en Mastodon
async function searchToots(query) {
  try {
    const response = await axios.get(`${mastodonApiUrl}/timelines/search`, {
      params: { q: query },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.data) {
      throw new Error("No data received from Mastodon API.");
    }
    return response.data.map((toot) => `${toot.account.display_name}: ${toot.content}`).join("\n\n") || "No se encontraron resultados.";
  } catch (error) {
    console.error("Error al realizar la búsqueda:", error.message);
    return "No se pudieron realizar los resultados de la búsqueda. Por favor, intenta de nuevo más tarde.";
  }
}

// Comando "/help" para mostrar las instrucciones del bot
bot.command("help", (ctx) => {
  console.log("Comando /help ejecutado");

  // Verificar si el contexto está disponible
  console.log("ctx", ctx);

  ctx
    .reply(
      "Hola! Soy el bot de gestión contable de commit_36. Aquí tienes las consultas que puedes realizar: \n\n" +
        "1) Obtener perfil Mastodon: /perfil \n" +
        "2) Obtener los últimos toots: /toots \n" +
        "3) Obtener notificaciones de Mastodon: /notificaciones \n" +
        "4) Ver las cuentas que sigues: /siguiendo \n" +
        "5) Buscar toots: /buscar [término]"
    )
    .then(() => {
      console.log("Respuesta enviada a Telegram");
    })
    .catch((err) => {
      console.error("Error al enviar la respuesta a Telegram:", err.message);
    });
});

// Comando "/perfil" para obtener el perfil de la cuenta
bot.command("perfil", async (ctx) => {
  try {
    const profile = await getProfile();
    ctx.reply(`Perfil de Mastodon:\n\nNombre: ${profile.display_name}\nBio: ${profile.note}\nURL: ${profile.url}`);
  } catch (error) {
    ctx.reply("Hubo un error al intentar obtener el perfil. Inténtalo de nuevo más tarde.");
  }
});

// Comando "/toots" para obtener los últimos "toots"
bot.command("toots", async (ctx) => {
  try {
    const timeline = await getTimeline();
    ctx.reply(`Últimos Toots:\n\n${timeline}`);
  } catch (error) {
    ctx.reply("Hubo un error al intentar obtener los toots. Inténtalo de nuevo más tarde.");
  }
});

// Comando "/notificaciones" para obtener las notificaciones
bot.command("notificaciones", async (ctx) => {
  try {
    const notifications = await getNotifications();
    ctx.reply(`Notificaciones:\n\n${notifications}`);
  } catch (error) {
    ctx.reply("Hubo un error al intentar obtener las notificaciones. Inténtalo de nuevo más tarde.");
  }
});

// Comando "/siguiendo" para obtener las cuentas que sigues
bot.command("siguiendo", async (ctx) => {
  try {
    const following = await getFollowing();
    ctx.reply(`Cuentas que sigues:\n\n${following}`);
  } catch (error) {
    ctx.reply("Hubo un error al intentar obtener las cuentas que sigues. Inténtalo de nuevo más tarde.");
  }
});

// Comando "/buscar" para buscar toots
bot.command("buscar", async (ctx) => {
  const query = ctx.message.text.replace("/buscar ", "").trim();
  if (!query) {
    return ctx.reply("Por favor, ingresa un término de búsqueda.");
  }

  try {
    const searchResults = await searchToots(query);
    ctx.reply(`Resultados de la búsqueda:\n\n${searchResults}`);
  } catch (error) {
    ctx.reply("Hubo un error al intentar realizar la búsqueda. Inténtalo de nuevo más tarde.");
  }
});

// Iniciar el webhook con validaciones
const port = process.env.PORT || 3000;
app.use(bot.webhookCallback("/telegraf"));

// Validar que la URL de ngrok esté disponible antes de intentar configurar el webhook
const webhookUrl = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook?url=${process.env.WEBHOOK_URL}/telegraf`; // Puedes personalizar el webhook URL
bot.telegram
  .setWebhook(webhookUrl)
  .then(() => {
    console.log(`Webhook successfully set at ${webhookUrl}`);
  })
  .catch((error) => {
    console.error("Error setting webhook:", error.message);
  });

app.listen(port, () => console.log("Webhook bot listening on port", port));

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
