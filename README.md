# 🐺 Lobisomem - Jogo de Dedução Social

Um jogo de dedução social inspirado em Town of Salem, desenvolvido com React, TypeScript e Tailwind CSS. Perfeito para jogar com amigos em festas e encontros!

## 🎮 Sobre o Jogo

Lobisomem é um jogo onde os jogadores assumem papéis secretos - alguns são inocentes tentando descobrir quem são os lobisomens, outros são lobisomens tentando eliminar os inocentes sem serem descobertos.

### 🎭 Classes Disponíveis

**Classes do Bem:**
- 👨‍🌾 **Aldeão** - Sem habilidades especiais
- 🔮 **Médium** - Pode ver a classe de jogadores mortos
- 👁️ **Vidente** - Descobre se um jogador é bom ou mau
- 💘 **Cupido** - Apaixona dois jogadores (se um morre, o outro também)
- 🛡️ **Talismã** - Protegido contra um ataque
- 🧙‍♀️ **Bruxa** - Possui poções de cura e veneno
- 🔫 **Bala de Prata** - Atira em alguém ao morrer
- 🛡️ **Guardião** - Protege um jogador por noite
- 🩸 **Hemomante** - Cria ligação de sangue com outro jogador
- ⚔️ **Herói** - Pode matar alguém (mas morre se errar)

**Classes do Mal:**
- 🤡 **Bobo** - Vence se for expulso
- 🗡️ **Traidor** - Ajuda os lobisomens
- 🧟 **Zumbi** - Infecta jogadores
- 🧛 **Vampiro** - Mata sozinho à noite
- 🐺 **Lobisomem** - Mata em grupo à noite
- 🐺 **Lobisomem Voodoo** - Pode matar extra se adivinhar a classe
- 🐺 **Lobisomem Mordaça** - Pode silenciar jogadores

**Classe Especial:**
- 🎭 **Occult** - Copia o papel de outro jogador

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js 18+ 
- pnpm (recomendado) ou npm

### Instalação e Execução

1. **Clone o repositório**
```bash
git clone <url-do-repo>
cd lobisomem-game
```

2. **Instale as dependências**
```bash
pnpm install
```

3. **Execute o servidor de desenvolvimento**
```bash
pnpm dev
```

4. **Abra no navegador**
```
http://localhost:5173
```

### Scripts Disponíveis

- `pnpm dev` - Inicia o servidor de desenvolvimento
- `pnpm build` - Gera build de produção
- `pnpm preview` - Visualiza o build de produção

## 🎯 Como Jogar

### 1. **Configuração**
- Defina o número de jogadores (4-20)
- Escolha quantos lobisomens terão
- Selecione quais classes estarão disponíveis
- Configure regras especiais

### 2. **Distribuição de Classes**
- Cada jogador vê sua classe individualmente
- Occult escolhe quem copiar
- Cupido escolhe os apaixonados

### 3. **Gameplay**
- **Noite:** Personagens fazem suas ações secretas
- **Dia:** Discussão e votação para expulsar suspeitos
- **Ciclo:** Continua até que um time vença

### 4. **Condições de Vitória**
- **Inocentes:** Eliminar todos os lobisomens
- **Lobisomens:** Número igual ou superior aos inocentes
- **Vampiro:** Sobrar apenas ele e mais um jogador
- **Zumbi:** Todos os jogadores vivos infectados
- **Cupido:** Dois apaixonados sobreviverem
- **Bobo:** Ser expulso

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** React Hooks
- **Responsividade:** Mobile-first design

## 📱 Características

- ✅ **Totalmente responsivo** - Otimizado para celular
- ✅ **Interface intuitiva** - Fácil de usar para todos
- ✅ **Design moderno** - Visual atrativo e profissional
- ✅ **PWA ready** - Pode ser instalado como app
- ✅ **Sem dependências externas** - Funciona offline

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🎉 Agradecimentos

- Inspirado no clássico jogo "Mafia" e "Town of Salem"
- Desenvolvido para trazer diversão e estratégia para grupos de amigos
- Interface otimizada para uso em dispositivos móveis

---

**Divirta-se jogando Lobisomem! 🐺✨**
