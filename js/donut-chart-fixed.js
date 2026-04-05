// Refined Neumorphic Donut Chart - Theme-Aware Mint Green + Cyan
function initializeDonutChart(catLabels, catData) {
  if (!catLabels.length) {
    document.getElementById("catChart").parentElement.innerHTML = 
      '<div class="empty-state" style="padding:30px"><div class="empty-icon">🥧</div><p>No data yet</p></div>';
    return;
  }

  var canvas = document.getElementById("catChart");
  var ctx = canvas.getContext("2d");
  
  // Get current theme
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  
  // Theme-aware color palettes
  var lightColors = [
    { start: '#3ab87d', end: '#2a9d66' },
    { start: '#00a3b8', end: '#008594' },
    { start: '#4dc98f', end: '#3ab87d' },
    { start: '#1ab5ca', end: '#00a3b8' },
    { start: '#2a9d66', end: '#1d8552' },
    { start: '#008594', end: '#00707f' },
    { start: '#5ed5a0', end: '#3fc489' }
  ];
  
  var darkColors = [
    { start: '#4adea8', end: '#3bc992' },
    { start: '#22d3ee', end: '#0ea5c9' },
    { start: '#5ee8b8', end: '#4adea8' },
    { start: '#38dcf2', end: '#22d3ee' },
    { start: '#3bc992', end: '#2db57d' },
    { start: '#0ea5c9', end: '#0891b2' },
    { start: '#6ff2c8', end: '#52e0b0' }
  ];
  
  var baseColors = isDark ? darkColors : lightColors;
  
  // Create refined gradients
  var gradientColors = catLabels.map(function(label, i) {
    var colorPair = baseColors[i % baseColors.length];
    var gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, colorPair.start);
    gradient.addColorStop(1, colorPair.end);
    return gradient;
  });
  
  // Calculate totals
  var total = catData.reduce(function(sum, val) { return sum + val; }, 0);
  var percentages = catData.map(function(val) { return ((val / total) * 100).toFixed(1); });
  
  // Create single tooltip element
  var tooltipEl = document.getElementById('chart-custom-tooltip');
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'chart-custom-tooltip';
    tooltipEl.className = 'chart-tooltip-glass';
    document.body.appendChild(tooltipEl);
  }
  
  // Create refined chart with thin ring
  var catChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: { 
      labels: catLabels, 
      datasets: [{ 
        data: catData, 
        backgroundColor: gradientColors,
        borderWidth: 3,
        borderColor: isDark ? '#1c1f2b' : '#ecf0f3',
        borderRadius: 4,
        spacing: 2,
        hoverOffset: 0,
        hoverBorderWidth: 3,
        hoverBorderColor: '#ffffff'
      }] 
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: true,
      cutout: '80%',
      radius: '95%',
      plugins: { 
        legend: { display: false },
        tooltip: { enabled: false }
      },
      animation: {
        animateRotate: true,
        animateScale: false,
        duration: 1200,
        easing: 'easeInOutQuart'
      },
      onHover: function(event, activeElements) {
        if (activeElements.length > 0) {
          var index = activeElements[0].index;
          var label = catLabels[index];
          var value = catData[index];
          var percentage = percentages[index];
          var colorPair = baseColors[index % baseColors.length];
          
          // Update center to show segment/total format - BOTH BIG
          var mintGradient = isDark 
            ? 'linear-gradient(135deg,#4adea8,#3bc992)' 
            : 'linear-gradient(135deg,#3ab87d,#2a9d66)';
          var textGradient = isDark 
            ? 'linear-gradient(135deg,#b8c1d3,#9aa3b2)' 
            : 'linear-gradient(135deg,#5a524c,#3d3530)';
          
          document.getElementById("chartCenter").innerHTML = 
            '<div style="font-size:30px;font-weight:900;line-height:1.1;margin-bottom:6px;letter-spacing:-0.5px;display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap;max-width:180px;">' +
              '<span style="background:' + mintGradient + ';-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">₹' + value.toFixed(0) + '</span>' +
              '<span style="color:' + (isDark ? '#9aa3b2' : '#a0aec0') + ';font-size:26px;font-weight:700;">/</span>' +
              '<span style="background:' + textGradient + ';-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">₹' + total.toFixed(0) + '</span>' +
            '</div>' +
            '<div style="font-size:9px;font-weight:800;color:' + (isDark ? '#9aa3b2' : '#7a6f66') + ';text-transform:uppercase;letter-spacing:1.2px;">' +
              label +
            '</div>';
          
          // Show tooltip near segment
          var chartArea = catChartInstance.chartArea;
          var element = activeElements[0].element;
          var centerX = (chartArea.left + chartArea.right) / 2;
          var centerY = (chartArea.top + chartArea.bottom) / 2;
          var angle = (element.startAngle + element.endAngle) / 2;
          var radius = element.outerRadius + 40;
          
          var tooltipX = centerX + Math.cos(angle) * radius;
          var tooltipY = centerY + Math.sin(angle) * radius;
          
          var canvasRect = canvas.getBoundingClientRect();
          
          tooltipEl.innerHTML = 
            '<div class="tooltip-color" style="background: linear-gradient(135deg, ' + colorPair.start + ', ' + colorPair.end + ')"></div>' +
            '<div class="tooltip-label">' + label + '</div>' +
            '<div class="tooltip-value">₹' + value.toFixed(2) + '</div>' +
            '<div class="tooltip-percent">' + percentage + '% of total</div>';
          
          tooltipEl.style.left = (canvasRect.left + tooltipX) + 'px';
          tooltipEl.style.top = (canvasRect.top + tooltipY + window.scrollY) + 'px';
          tooltipEl.classList.add('visible');
          
        } else {
          // Reset to total
          document.getElementById("chartCenter").innerHTML = 
            '<div class="neuro-chart-center-value">₹' + total.toFixed(0) + '</div>' +
            '<div class="neuro-chart-center-label">TOTAL SALES</div>';
          tooltipEl.classList.remove('visible');
        }
      }
    }
  });
  
  // Set initial center - Bold and prominent
  document.getElementById("chartCenter").innerHTML = 
    '<div class="neuro-chart-center-value">₹' + total.toFixed(0) + '</div>' +
    '<div class="neuro-chart-center-label">TOTAL SALES</div>';
  
  // Create refined legend
  var legendHTML = catLabels.map(function(label, i) {
    var colorPair = baseColors[i % baseColors.length];
    return '<div class="neuro-legend-item" data-index="' + i + '">' +
      '<div class="neuro-legend-indicator" style="background:linear-gradient(135deg, ' + colorPair.start + ', ' + colorPair.end + ')"></div>' +
      '<div class="neuro-legend-text">' +
        '<div class="neuro-legend-label">' + label + '</div>' +
        '<div class="neuro-legend-value">₹' + catData[i].toFixed(2) + '</div>' +
      '</div>' +
      '<div class="neuro-legend-percentage">' + percentages[i] + '%</div>' +
    '</div>';
  }).join('');
  
  document.getElementById("catLegend").innerHTML = legendHTML;
  
  // Legend click only (no hover)
  document.querySelectorAll('.neuro-legend-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var index = parseInt(this.getAttribute('data-index'));
      var meta = catChartInstance.getDatasetMeta(0);
      meta.data[index].hidden = !meta.data[index].hidden;
      catChartInstance.update();
      this.style.opacity = meta.data[index].hidden ? '0.4' : '1';
    });
  });
}
