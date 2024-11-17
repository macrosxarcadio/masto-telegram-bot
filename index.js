const express = require("express");
const { Telegraf } = require("telegraf");
var moment = require("moment");
const axios = require("axios"); // Importar Axios para interactuar con Mastodon
require("dotenv").config();
const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

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
    return response.data;
  } catch (error) {
    console.error("Error al obtener el perfil:", error.response ? error.response.data : error.message);
    return "No se pudo obtener el perfil.";
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
    return response.data.map((toot) => `${toot.account.display_name}: ${toot.content}`).join("\n\n");
  } catch (error) {
    console.error("Error al obtener los toots:", error.response ? error.response.data : error.message);
    return "No se pudieron obtener los últimos toots.";
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
    return response.data.map((notification) => `${notification.type}: ${notification.status.account.display_name}`).join("\n\n");
  } catch (error) {
    console.error("Error al obtener las notificaciones:", error.response ? error.response.data : error.message);
    return "No se pudieron obtener las notificaciones.";
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
    return response.data.map((account) => (account.following ? account.account.display_name : "No sigues a nadie")).join("\n\n");
  } catch (error) {
    console.error("Error al obtener las cuentas que sigues:", error.response ? error.response.data : error.message);
    return "No se pudieron obtener las cuentas que sigues.";
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
    return response.data.map((toot) => `${toot.account.display_name}: ${toot.content}`).join("\n\n");
  } catch (error) {
    console.error("Error al realizar la búsqueda:", error.response ? error.response.data : error.message);
    return "No se pudieron realizar los resultados de la búsqueda.";
  }
}

// Comando "/help" para mostrar las instrucciones del bot
bot.command("help", (ctx) => {
  ctx.reply(
    "Hola! soy el bot de gestión contable de commit_36 \n\n Consultas que puedes realizar: \n\n 1) Obtener perfil Mastodon: /perfil \n 2) Obtener los últimos toots: /toots \n 3) Obtener notificaciones de Mastodon: /notificaciones \n 4) Ver las cuentas que sigues: /siguiendo \n 5) Buscar toots: /buscar [término]"
  );
});

// Comando "/perfil" para obtener el perfil de la cuenta
bot.command("perfil", async (ctx) => {
  const profile = await getProfile();
  ctx.reply(`Perfil de Mastodon:\n\nNombre: ${profile.display_name}\nBio: ${profile.note}\nURL: ${profile.url}`);
});

// Comando "/toots" para obtener los últimos "toots"
bot.command("toots", async (ctx) => {
  const timeline = await getTimeline();
  ctx.reply(`Últimos Toots:\n\n${timeline}`);
});

// Comando "/notificaciones" para obtener las notificaciones
bot.command("notificaciones", async (ctx) => {
  const notifications = await getNotifications();
  ctx.reply(`Notificaciones:\n\n${notifications}`);
});

// Comando "/siguiendo" para obtener las cuentas que sigues
bot.command("siguiendo", async (ctx) => {
  const following = await getFollowing();
  ctx.reply(`Cuentas que sigues:\n\n${following}`);
});

// Comando "/buscar" para buscar toots
bot.command("buscar", async (ctx) => {
  const query = ctx.message.text.replace("/buscar ", "").trim();
  if (!query) {
    return ctx.reply("Por favor, ingresa un término de búsqueda.");
  }
  const searchResults = await searchToots(query);
  ctx.reply(`Resultados de la búsqueda:\n\n${searchResults}`);
});

// Iniciar el webhook
const port = process.env.PORT || 1000;
app.use(bot.webhookCallback("/telegraf"));
bot.telegram.setWebhook(`https://telegram-bot-g1vd.onrender.com/telegraf`);
app.listen(port, () => console.log("Webhook bot listening on port", port));

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
