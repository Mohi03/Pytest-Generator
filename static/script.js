document.addEventListener('DOMContentLoaded', function() {
    const userStoryInput = document.getElementById('userStory');
    const generateBtn = document.getElementById('generateBtn');
    const scenariosSection = document.getElementById('scenariosSection');
    const scenarioList = document.getElementById('scenarioList');
    const addScenarioBtn = document.getElementById('addScenarioBtn');
    const confirmScenariosBtn = document.getElementById('confirmScenariosBtn');
    const resultsSection = document.getElementById('resultsSection');
    const outputDiv = document.getElementById('results');
    const copyResultsBtn = document.getElementById('copyResultsBtn');
    const copyStatus = document.getElementById('copyStatus');
    const startOverBtn = document.getElementById('startOverBtn');
    const userStoryError = document.getElementById('userStoryError');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const confirmLoadingIndicator = document.getElementById('confirmLoadingIndicator');
    
    function isUserStory(text) {
        const lowerText = text.toLowerCase().trim();
        const keywords = ["as a", "i want to", "so that"];
        const startsWithAsA = lowerText.startsWith("as a ");
        const containsIWantTo = lowerText.includes("i want to ");
        const containsSoThat = lowerText.includes("so that ");
      
        if (startsWithAsA && containsIWantTo && containsSoThat) {
          return true;
        }

        if (startsWithAsA && containsIWantTo) {
          return true;
        }

        if (containsIWantTo && containsSoThat) {
          return true;
        }
        const commonStarts = ["as", "i want", "want to"];
        if (commonStarts.some(start => lowerText.startsWith(start))) {
          const parts = lowerText.split(/\s+/); // Split by whitespace
          if (parts.length >= 3 && (parts.includes("want") || lowerText.includes("want to"))) {
            return true;
          }
        }
      
        return false;
    }

    generateBtn.addEventListener('click', function() {
        const userStory = userStoryInput.value.trim();
        
        if (!isUserStory(userStory)) {
            userStoryError.classList.remove('hidden');
            return;
        }
        
        userStoryError.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');
        generateBtn.disabled = true;
        
        // Initial call to get scenarios
        fetch('https://pytest-generator-production.up.railway.app/main', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userStory: userStory,
                scenarios: []
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.acceptance_criteria) {
                const scenarios = data.acceptance_criteria.split(/(?=\*\*Scenario \d+:)/).filter(scenario => scenario.trim() !== "");
                scenarioList.innerHTML = '';
                scenarios.forEach(scenario => {
                    const titleMatch = scenario.match(/\*\*Scenario \d+:\s*(.*?)\*\*/);
                    if (titleMatch && titleMatch[1]) {
                        const title = titleMatch[1].trim();
                        const line = scenario.replace(titleMatch[0], '').trim();
                        addGWTScenario(line, title);
                    }
                });
                scenariosSection.classList.remove('hidden');
            } else if (data.error) {
                console.error('Error:', data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        })
        .finally(() => {
            loadingIndicator.classList.add('hidden');
            generateBtn.disabled = false;
        });
    });

    addScenarioBtn.addEventListener('click', function() {
        addGWTScenario('', true);
    });

    function highlightPythonCode(code) {
        // Create a pre element to preserve formatting
        const preElement = document.createElement('pre');
        preElement.className = 'python-code';
        
        // Escape HTML to prevent XSS and ensure proper display
        const escapedCode = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Apply syntax highlighting with more precise regex patterns
        let highlightedCode = escapedCode;
        
        // Process in specific order to avoid conflicts
        
        // 1. Comments (must be first)
        highlightedCode = highlightedCode.replace(/(#.*$)/gm, '<span class="comment">$1</span>');
        
        // 2. Multiline strings (triple quotes)
        highlightedCode = highlightedCode.replace(/(&quot;&quot;&quot;[\s\S]*?&quot;&quot;&quot;)|('''[\s\S]*?''')/g, '<span class="string">$1</span>');
        
        // 3. Single-line strings
        highlightedCode = highlightedCode.replace(/(&quot;.*?&quot;)|('.*?')/g, '<span class="string">$1</span>');
        
        // 4. Numbers (integers, floats, scientific notation)
        highlightedCode = highlightedCode.replace(/\b(\d+\.\d+|\d+)\b/g, '<span class="number">$1</span>');
        
        // 5. Function definitions
        highlightedCode = highlightedCode.replace(/\b(def)\s+(\w+)\s*\(/g, '<span class="function">$1 $2</span>(');
        
        // 6. Class definitions
        highlightedCode = highlightedCode.replace(/\b(class)\s+(\w+)(?:\s*\([^)]*\))?:/g, '<span class="class">$1 $2</span>:');
        
        // 7. Decorators
        highlightedCode = highlightedCode.replace(/@(\w+)/g, '<span class="decorator">@$1</span>');
        
        // 8. Assert statements
        highlightedCode = highlightedCode.replace(/\b(assert)\b/g, '<span class="assert">$1</span>');
        
        // 9. Import statements
        highlightedCode = highlightedCode.replace(/\b(import|from)\b/g, '<span class="import">$1</span>');
        
        // 10. Exception handling
        highlightedCode = highlightedCode.replace(/\b(try|except|raise|finally)\b/g, '<span class="exception">$1</span>');
        
        // 11. Keywords (excluding import and from)
        const keywords = [
            'if', 'else', 'elif', 'for', 'while', 'with', 'as', 'return', 'pass', 
            'break', 'continue', 'True', 'False', 'None', 'and', 'or', 'not', 
            'in', 'is', 'lambda', 'global', 'nonlocal', 'yield', 'async', 'await'
        ];
        highlightedCode = highlightedCode.replace(
            new RegExp(`\\b(${keywords.join('|')})\\b`, 'g'), 
            '<span class="keyword">$1</span>'
        );
        
        // Set the innerHTML of the pre element
        preElement.innerHTML = highlightedCode;
        
        // Return the pre element
        return preElement.outerHTML;
    }

    confirmScenariosBtn.addEventListener('click', function() {
        const scenarios = [];
        const scenarioElements = scenarioList.querySelectorAll('.scenario-item');
        
        scenarioElements.forEach(item => {
            const given = item.querySelector('.given-textarea').value.trim();
            if (given) {
                scenarios.push(given);
            }
        });
        
        if (scenarios.length === 0) {
            alert('Please add at least one scenario');
            return;
        }
        
        const userStory = userStoryInput.value.trim();
        confirmScenariosBtn.disabled = true;
        confirmLoadingIndicator.classList.remove('hidden');
        
        // Send scenarios for test generation
        fetch('https://pytest-generator-production.up.railway.app/main', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userStory: userStory,
                scenarios: scenarios
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.pytest_tests) {
                // Clear the output div first
                outputDiv.innerHTML = '';
                // Add the highlighted code
                outputDiv.innerHTML = highlightPythonCode(data.pytest_tests);
                scenariosSection.classList.add('hidden');
                resultsSection.classList.remove('hidden');
            } else if (data.error) {
                console.error('Error:', data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        })
        .finally(() => {
            confirmLoadingIndicator.classList.add('hidden');
            confirmScenariosBtn.disabled = false;
        });
    });
    
    copyResultsBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(outputDiv.textContent)
            .then(() => {
                copyStatus.classList.remove('hidden');
                setTimeout(() => copyStatus.classList.add('hidden'), 2000);
            });
    });
    
    startOverBtn.addEventListener('click', function() {
        userStoryInput.value = '';
        scenarioList.innerHTML = '';
        outputDiv.textContent = '';
        resultsSection.classList.add('hidden');
        scenariosSection.classList.add('hidden');
        window.scrollTo(0, 0);
    });

    function addGWTScenario(given, title) {
        const scenarioId = Date.now();
        const scenarioItem = document.createElement('div');
        scenarioItem.className = 'scenario-item';
        scenarioItem.dataset.id = scenarioId;
        
        scenarioItem.innerHTML = `
            <div class="scenario-header">
                <div class="scenario-title">Scenario ${title}</div>
                <button class="btn btn-danger btn-sm remove-btn" data-id="${scenarioId}">Remove</button>
            </div>
            
            <div class="gwt-section given-section">
                <label class="gwt-label"></label>
                <textarea class="given-textarea" placeholder="Initial context and preconditions...">${given}</textarea>
            </div>
        `;
        
        scenarioList.appendChild(scenarioItem);
        
        scenarioItem.querySelector('.remove-btn').addEventListener('click', function() {
            if (confirm('Are you sure you want to remove this scenario?')) {
                scenarioItem.remove();
            }
        });
    }
});
