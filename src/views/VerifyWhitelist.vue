<template>
  <div class="verify-container">
    <div class="verify-card">
      <div v-if="loading" class="loading-state">
        <el-icon class="loading-icon">
          <Loading/>
        </el-icon>
        <span>正在验证...</span>
      </div>

      <div v-else-if="error" class="error-state">
        <el-icon class="error-icon">
          <Warning/>
        </el-icon>
        <span>{{ error }}</span>
        <el-button type="primary" @click="retryVerify">重试</el-button>
      </div>

      <div v-else-if="redirectToQuiz" class="redirect-state">
        <el-icon class="info-icon">
          <InfoFilled/>
        </el-icon>
        <span>请先完成白名单验证题目</span>
        <el-button type="primary" @click="goToQuiz">前往答题</el-button>
      </div>

      <div v-else-if="success" class="success-state">
        <el-icon class="success-icon">
          <CircleCheck/>
        </el-icon>
        <span>验证成功!</span>
        <p class="success-message">{{ successMessage }}</p>
        <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {CircleCheck, InfoFilled, Loading, Warning} from '@element-plus/icons-vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref(null)
const success = ref(false)
const successMessage = ref('')
const redirectToQuiz = ref(false)

const verifyCode = async () => {
  const code = route.query.code
  if (!code) {
    error.value = '验证码不能为空'
    loading.value = false
    return
  }

  try {
    // 获取用户IP的函数
    const getIpFromPrimarySource = () => {
      return fetch('https://api.ipify.org?format=json')
          .then(response => response.json())
          .catch(error => {
            console.warn('主要IP获取接口失败，尝试备用接口:', error)
            return getIpFromBackupSource()
          })
    }

    // 备用IP获取接口
    const getIpFromBackupSource = () => {
      return fetch('https://ipinfo.io/json')
          .then(response => response.json())
          .catch(error => {
            console.warn('备用IP获取接口也失败:', error)
            return {}
          })
    }

    // 获取IP
    const ipData = await getIpFromPrimarySource()

    // 准备请求头
    const headers = {
      'Content-Type': 'application/json'
    }

    // 如果成功获取到IP，添加到请求头
    if (ipData && ipData.ip) {
      headers['X-Real-IP'] = ipData.ip
    }

    // 确保API URL使用HTTPS
    const apiUrl = import.meta.env.VITE_API_URL || ''

    // 首先检查是否有问卷题目
    try {
      const questionsRes = await axios.get(`${apiUrl}/api/v1/getQuestions`, {
        params: {code: code.value},
        headers,
        withCredentials: true
      })

      // 如果有问卷题目且非空，检查是否已完成
      if (questionsRes.data.code === 200 &&
          questionsRes.data.data &&
          Array.isArray(questionsRes.data.data) &&
          questionsRes.data.data.length > 0) {

        console.log('检测到问卷题目，检查是否已完成问卷')

        // 检查问卷状态
        try {
          const quizStatusRes = await axios.get(`${apiUrl}/api/v1/checkQuizStatus`, {
            params: {code},
            headers,
            withCredentials: true
          })

          // 如果状态检查返回未完成问卷，重定向到问卷页面
          if (quizStatusRes.data.code === 200 && quizStatusRes.data.msg === "未完成问卷") {
            console.log('问卷未完成，重定向到问卷页面')
            redirectToQuiz.value = true
            loading.value = false
            return
          }
        } catch (statusErr) {
          console.warn('获取问卷状态失败，假设问卷未完成:', statusErr)
          redirectToQuiz.value = true
          loading.value = false
          return
        }
      } else {
        console.log('无问卷题目或题目为空，直接进行验证')
      }

      // 没有问卷或已完成问卷，继续验证
      const res = await axios.get(`${apiUrl}/mc/whitelist/verify`, {
        params: {code},
        headers,
        withCredentials: true
      })

      if (res.data.code === 200) {
        success.value = true
        successMessage.value = res.data.msg || '验证成功,请等待管理员审核!'
      } else {
        error.value = res.data.msg || '验证失败'
      }
    } catch (err) {
      console.warn('获取问卷题目失败，尝试直接验证:', err)

      // 获取问卷题目失败，继续验证流程
      try {
        const res = await axios.get(`${apiUrl}/mc/whitelist/verify`, {
          params: {code},
          headers,
          withCredentials: true
        })

        if (res.data.code === 200) {
          success.value = true
          successMessage.value = res.data.msg || '验证成功,请等待管理员审核!'
        } else {
          error.value = res.data.msg || '验证失败'
        }
      } catch (verifyErr) {
        console.error('验证请求失败:', verifyErr)
        if (verifyErr.message && verifyErr.message.includes('Network Error')) {
          error.value = '网络连接错误，请检查网络设置或联系管理员'
        } else if (verifyErr.message && verifyErr.message.includes('CORS')) {
          error.value = '跨域请求错误，请联系管理员配置服务器访问权限'
        } else {
          error.value = '验证过程中出现错误,请稍后重试'
        }
      }
    }
  } catch (err) {
    console.error('验证过程中出现错误:', err)
    if (err.message && err.message.includes('Network Error')) {
      error.value = '网络连接错误，请检查网络设置或联系管理员'
    } else if (err.message && err.message.includes('CORS')) {
      error.value = '跨域请求错误，请联系管理员配置服务器访问权限'
    } else {
      error.value = '验证过程中出现错误,请稍后重试'
    }
  } finally {
    loading.value = false
  }
}

const goToQuiz = () => {
  router.push({
    path: '/quiz',
    query: {code: route.query.code}
  })
}

const retryVerify = () => {
  loading.value = true
  error.value = null
  success.value = false
  redirectToQuiz.value = false
  verifyCode()
}

onMounted(() => {
  verifyCode()
})
</script>

<style scoped>
.verify-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--theme-gradient);
  padding: 20px;
  font-family: 'CustomFont', sans-serif;
}

.verify-card {
  background: var(--theme-bg);
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 300px;
  backdrop-filter: blur(8px);
  font-family: 'CustomFont', sans-serif;
}

.loading-state,
.error-state,
.redirect-state,
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  font-family: 'CustomFont', sans-serif;
}

.loading-icon {
  font-size: 48px;
  color: var(--theme-primary);
  animation: rotate 2s linear infinite;
}

.error-icon {
  font-size: 48px;
  color: #f56c6c;
}

.success-icon {
  font-size: 48px;
  color: #67c23a;
}

.info-icon {
  font-size: 48px;
  color: #409EFF;
}

.success-message {
  color: var(--theme-text);
  margin: 16px 0;
  font-family: 'CustomFont', sans-serif;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 自定义 Element Plus 组件样式 */
:deep(.el-button) {
  font-family: 'CustomFont', sans-serif;
}
</style> 