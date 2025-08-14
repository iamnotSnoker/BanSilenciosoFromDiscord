import definePlugin, { OptionType } from "@utils/types";
import { definePluginSettings } from "@api/Settings";
import { React } from "@webpack/common";

// Configuración del plugin
const settings = definePluginSettings({
    channelIds: {
        type: OptionType.STRING,
        default: "",
        description: "Introduce las IDs de los canales separadas por comas (EJ:1111111111111111111,2222222222222222222)"
    }
});

// Componente para el panel de configuración
function ChannelIdsPanel() {
    const [value, setValue] = React.useState(settings.store.channelIds || "");

    return (
        <div style={{ padding: 16 }}>
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Introduce las Channel IDs separadas por comas"
                style={{
                    width: "100%",
                    padding: "8px",
                    fontSize: "14px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    marginBottom: "8px"
                }}
            />
            <button
                onClick={() => {
                    // Limpiar y guardar
                    const cleanedValue = value
                        .split(",")
                        .map(id => id.trim())
                        .filter(Boolean)
                        .join(",");
                    settings.store.channelIds = cleanedValue;
                    console.log("Channel IDs guardadas:", cleanedValue);
                }}
                style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    borderRadius: "4px",
                    backgroundColor: "#7289da",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer"
                }}
            >
                Guardar
            </button>
        </div>
    );
}

// Variable para guardar el ID del interval
let cerrarInterval: number | undefined;

// Función que busca y cierra los DMs según las IDs configuradas
function cerrarDMs() {
    const ids = settings.store.channelIds?.split(",").map(id => id.trim()).filter(Boolean);
    if (!ids || ids.length === 0) return;

    // 1️⃣ Revisar DMs abiertos normalmente
    const dmLinks = document.querySelectorAll<HTMLAnchorElement>('li a[href^="/channels/@me/"]');
    dmLinks.forEach(link => {
        const href = link.getAttribute('href');
        const dmItem = link.closest('li');
        if (!dmItem || !href) return;

        if (ids.some(id => href.endsWith(id))) {
            const closeBtn = dmItem.querySelector<HTMLElement>('.closeButton__972a0');
            closeBtn?.click();
            console.log(`DM con ID ${href.split("/").pop()} cerrado automáticamente.`);
        }
    });

    // 2️⃣ Revisar DMs en la barra lateral (guildsnav)
    const dmDivs = document.querySelectorAll<HTMLDivElement>('div[data-list-item-id^="guildsnav___"]');
    dmDivs.forEach(div => {
        const fullId = div.getAttribute('data-list-item-id');
        if (!fullId) return;

        const channelId = fullId.split("___")[1];
        if (ids.includes(channelId)) {
            const dmItem = div.closest('li, div'); // depende de la estructura
            const closeBtn = dmItem?.querySelector<HTMLElement>('.closeButton__972a0');
            closeBtn?.click();
            console.log(`DM en barra lateral con ID ${channelId} cerrado automáticamente.`);
        }
    });
}

// Plugin principal
export default definePlugin({
    name: "BanSilencioso",
    description: "Banea silenciosamente a cualquier persona sin que esta se de cuenta ",
    authors: [{ name: "Snoker", id: 817697049406603275n }], 
    settings,
    renderSettings: () => <ChannelIdsPanel />,

    start() {
        console.log("Plugin iniciado. Channel IDs actuales:", settings.store.channelIds);

        // Ejecutar cada 50ms para cerrar DMs automáticamente
        cerrarInterval = window.setInterval(cerrarDMs, 50) as unknown as number;
    },

    stop() {
        // Detener el bucle al desactivar
        if (cerrarInterval) {
            clearInterval(cerrarInterval);
            cerrarInterval = undefined;
            console.log("Plugin detenido. No se cerrarán más DMs automáticamente.");
        }
    }
});
