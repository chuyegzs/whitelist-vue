<template>
  <div
      class="app-wrapper"
      @click.self="handleBlur"
      @touchstart.self="handleBlur"
  >
    <SakuraBackground
        :currentTheme="currentTheme"
        :isDark="isDark"
    />
    <div :class="{ 'focused': isFocused }" class="servers-container">
      <div class="title-container">
        <i class="el-icon-connection"></i>
        <h2>我的服务器</h2>
        <el-button
            class="back-btn"
            text
            type="primary"
            @click="router.back()"
        >
          <el-icon>
            <Back/>
          </el-icon>
          返回
        </el-button>
      </div>

      <div class="description">
        以下是您当前绑定的所有服务器信息。
      </div>

      <div class="servers-content">
        <div v-if="loading" class="loading-state">
          <el-icon class="loading-icon">
            <Loading/>
          </el-icon>
          <span>加载中...</span>
        </div>

        <template v-else>
          <div v-if="servers.length === 0" class="no-data">
            <el-empty description="暂无绑定的服务器"/>
          </div>

          <div v-else class="server-list">
            <div v-for="server in servers"
                 :key="server.ip + server.port"
                 class="server-card animate-in">
              <div class="server-header">
                <div class="server-name">
                  <el-tag :type="server.status === 'OK' ? 'success' : 'danger'" size="small">
                    {{ server.status === 'OK' ? '运行中' : '离线' }}
                  </el-tag>
                  {{ server.nameTag }}
                </div>
                <div class="server-version">
                  <el-tag size="small" type="info">{{ server.version }}</el-tag>
                </div>
              </div>

              <div class="server-info">
                <div class="info-item">
                  <i class="el-icon-connection"></i>
                  <span class="label">地址：</span>
                  <span class="value">{{ server.ip }}:{{ server.port }}</span>
                  <el-button
                      class="copy-btn"
                      size="small"
                      text
                      @click="copyToClipboard(`${server.ip}:${server.port}`)"
                  >
                    <el-icon>
                      <CopyDocument/>
                    </el-icon>
                  </el-button>
                </div>

                <div class="info-item">
                  <i class="el-icon-cpu"></i>
                  <span class="label">核心：</span>
                  <span class="value">{{ server.core }}</span>
                </div>

                <div class="info-item">
                  <i class="el-icon-timer"></i>
                  <span class="label">上线时间：</span>
                  <span class="value">{{ server.up_time }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {ElMessage} from 'element-plus';
import axios from 'axios';
import {Back, CopyDocument, Loading} from '@element-plus/icons-vue';
import SakuraBackground from './common/SakuraBackground.vue';

const route = useRoute();
const router = useRouter();

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 8000
});

const loading = ref(false);
const servers = ref([]);
const isFocused = ref(false);
const currentTheme = ref(localStorage.getItem('theme') || 'default');
const isDark = ref(document.documentElement.classList.contains('dark'));

const handleBlur = () => {
  isFocused.value = false;
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success('已复制到剪贴板');
  } catch (err) {
    ElMessage.error('复制失败');
  }
};

const fetchServerInfo = async () => {
  loading.value = true;
  try {
    const gameId = route.params.gameId;
    if (!gameId) {
      ElMessage.error('缺少必要的参数');
      router.push('/');
      return;
    }

    const response = await http.get(`/server/serverlist/getServerInfoByGameId/${gameId}`);

    if (response.data.code === 200) {
      servers.value = response.data.data;
    } else {
      ElMessage.error(response.data.msg || '获取服务器信息失败');
    }
  } catch (error) {
    console.error('获取服务器信息失败：', error);
    ElMessage.error('获取服务器信息失败，请检查网络或联系管理员');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchServerInfo();
});
</script>

<style scoped>
.app-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  background-size: 400% 400%;
  background-image: var(--theme-gradient);
  animation: warmGradient 20s ease infinite;
  font-family: 'CustomFont', sans-serif;
}

.servers-container {
  background: var(--theme-bg);
  color: var(--theme-text);
  backdrop-filter: blur(8px);
  padding: 30px;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: min(100%, 800px);
  transform: translateY(0);
  transition: all 0.3s ease;
}

.servers-container:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.title-container {
  text-align: center;
  margin-bottom: 25px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
}

.title-container h2 {
  color: var(--theme-primary);
  font-size: 28px;
  margin: 10px 0;
  flex-grow: 0;
}

.description {
  text-align: center;
  color: #333;
  margin-bottom: 25px;
  font-size: 14px;
  font-weight: 500;
}

.back-btn {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--theme-primary);
  transition: all 0.3s ease;
  padding: 6px 12px;
  border-radius: 15px;
  background: rgba(var(--theme-primary-rgb), 0.1);
}

.back-btn:hover {
  color: var(--theme-secondary);
  transform: translateY(-50%) translateX(-2px);
  background: rgba(var(--theme-primary-rgb), 0.15);
}

.servers-content {
  min-height: 200px;
}

.server-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 10px;
}

.server-card {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.server-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8);
}

.server-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.server-name {
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
}

.info-item i {
  margin-right: 8px;
  color: var(--theme-primary);
}

.info-item .label {
  color: #666;
  margin-right: 8px;
  min-width: 70px;
}

.info-item .value {
  color: #333;
  flex: 1;
}

.copy-btn {
  padding: 2px 4px;
  margin-left: 8px;
}

.copy-btn:hover {
  color: var(--theme-primary);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 10px;
}

.loading-icon {
  font-size: 24px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

/* Dark mode styles */
.dark .servers-container {
  background: rgba(35, 35, 45, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dark .description {
  color: rgba(255, 255, 255, 0.9);
}

.dark .server-card {
  background: rgba(35, 35, 45, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dark .server-card:hover {
  background: rgba(35, 35, 45, 0.9);
}

.dark .info-item .label {
  color: rgba(255, 255, 255, 0.6);
}

.dark .info-item .value {
  color: rgba(255, 255, 255, 0.9);
}

/* Mobile responsive styles */
@media (max-width: 768px) {
  .servers-container {
    padding: 20px;
    margin: 10px;
  }

  .server-list {
    grid-template-columns: 1fr;
  }

  .title-container h2 {
    font-size: 24px;
  }

  .back-btn {
    right: 10px;
    font-size: 13px;
    padding: 4px 10px;
  }
}

/* Animation */
.animate-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>